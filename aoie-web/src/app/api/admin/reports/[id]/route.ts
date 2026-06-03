import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { deleteArtworkAsset } from "@/lib/deleteArtworkAsset";
import {
  sendArtistWarningEmail,
  sendReportDecisionEmail,
} from "@/lib/sendArtworkReportEmail";
import Artwork from "@/models/Artwork";
import ArtworkReport from "@/models/ArtworkReport";
import Collection from "@/models/Collection";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import Save from "@/models/Save";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

type PopulatedReport = {
  _id: Types.ObjectId;
  status: "pending" | "valid" | "invalid";
  artwork?: {
    _id: Types.ObjectId;
    title: string;
    imageUrl: string;
  } | null;
  reporter?: {
    _id: Types.ObjectId;
    username?: string | null;
    email: string;
  } | null;
  artist?: {
    _id: Types.ObjectId;
    username?: string | null;
    email: string;
  } | null;
};

export async function PATCH(
  req: Request,
  { params }: RouteProps
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "admin" ||
      session.user.role === "super-admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid report" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const status =
      body.status === "valid" || body.status === "invalid"
        ? body.status
        : "";
    const removeArtwork = body.removeArtwork === true;
    const adminNote =
      typeof body.adminNote === "string"
        ? body.adminNote.trim().slice(0, 800)
        : "";

    if (!status) {
      return Response.json(
        { success: false, message: "Invalid report decision" },
        { status: 400 }
      );
    }

    await connectDB();

    const report = (await ArtworkReport.findById(id)
      .populate("artwork", "title imageUrl")
      .populate("reporter", "username email")
      .populate("artist", "username email")) as unknown as PopulatedReport | null;

    if (!report) {
      return Response.json(
        { success: false, message: "Report not found" },
        { status: 404 }
      );
    }

    const actionTaken =
      status === "valid" && removeArtwork && report.artwork
        ? "artwork_removed"
        : "none";

    await ArtworkReport.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          status,
          adminNote,
          reviewedBy: new Types.ObjectId(session.user.id),
          reviewedAt: new Date(),
          actionTaken,
        },
      }
    );

    if (report.reporter?.email) {
      await sendReportDecisionEmail({
        email: report.reporter.email,
        username:
          report.reporter.username || "AOIE user",
        artworkTitle:
          report.artwork?.title || "reported artwork",
        status,
        adminNote,
      });
    }

    if (
      status === "valid" &&
      removeArtwork &&
      report.artwork
    ) {
      const artworkId = report.artwork._id;

      await Promise.all([
        Like.deleteMany({ artwork: artworkId }),
        Save.deleteMany({ artwork: artworkId }),
        Comment.deleteMany({ artwork: artworkId }),
        Collection.updateMany(
          {
            artworks: artworkId,
          },
          {
            $pull: { artworks: artworkId },
            $unset: { coverArtwork: "" },
          }
        ),
        ArtworkReport.updateMany(
          {
            artwork: artworkId,
            _id: { $ne: report._id },
            status: "pending",
          },
          {
            $set: {
              status: "valid",
              adminNote:
                "Artwork was removed after a related report was accepted.",
              reviewedBy: new Types.ObjectId(session.user.id),
              reviewedAt: new Date(),
              actionTaken: "artwork_removed",
            },
          }
        ),
      ]);

      await Artwork.deleteOne({ _id: artworkId });
      await deleteArtworkAsset(report.artwork.imageUrl);

      if (report.artist?.email) {
        await sendArtistWarningEmail({
          email: report.artist.email,
          username:
            report.artist.username || "AOIE artist",
          artworkTitle: report.artwork.title,
          adminNote,
        });
      }
    }

    return Response.json({
      success: true,
      status,
      actionTaken,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
