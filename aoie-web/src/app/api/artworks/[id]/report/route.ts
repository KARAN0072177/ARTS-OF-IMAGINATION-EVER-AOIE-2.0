import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import ArtworkReport from "@/models/ArtworkReport";

const reasons = [
  "Copyright or stolen artwork",
  "Explicit or unsafe content",
  "Hate or harassment",
  "Spam or misleading",
  "Other",
];

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
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

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid artwork" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";
    const details =
      typeof body.details === "string"
        ? body.details.trim().slice(0, 1000)
        : "";

    if (!reasons.includes(reason)) {
      return Response.json(
        { success: false, message: "Please choose a report reason." },
        { status: 400 }
      );
    }

    await connectDB();

    const artwork = await Artwork.findById(id).select(
      "artist"
    );

    if (!artwork) {
      return Response.json(
        { success: false, message: "Artwork not found" },
        { status: 404 }
      );
    }

    if (artwork.artist.toString() === session.user.id) {
      return Response.json(
        {
          success: false,
          message: "You cannot report your own artwork.",
        },
        { status: 400 }
      );
    }

    const existing = await ArtworkReport.findOne({
      artwork: artwork._id,
      reporter: session.user.id,
      status: "pending",
    }).lean();

    if (existing) {
      return Response.json(
        {
          success: false,
          message: "You already have a pending report for this artwork.",
        },
        { status: 409 }
      );
    }

    await ArtworkReport.create({
      artwork: artwork._id,
      reporter: session.user.id,
      artist: artwork.artist,
      reason,
      details,
    });

    return Response.json(
      {
        success: true,
        message: "Report sent to admin review.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
