import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import User from "@/models/User";
import { sendArtistApplicationDecisionEmail } from "@/lib/sendArtistApplicationEmail";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

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
        { success: false, message: "Invalid application" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const action =
      body.action === "approve" ||
      body.action === "reject"
        ? body.action
        : "";
    const adminNote =
      typeof body.adminNote === "string"
        ? body.adminNote.trim().slice(0, 500)
        : "";

    if (!action) {
      return Response.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    await connectDB();

    const application =
      await ArtistApplication.findById(id);

    if (!application) {
      return Response.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    const user = await User.findById(
      application.user
    );

    if (!user) {
      return Response.json(
        { success: false, message: "Applicant not found" },
        { status: 404 }
      );
    }

    application.status =
      action === "approve" ? "approved" : "rejected";
    application.adminNote = adminNote;
    application.reviewedBy = new Types.ObjectId(
      session.user.id
    );
    application.reviewedAt = new Date();

    if (action === "approve") {
      user.role = "artist";
      user.artistApplicationStatus = "approved";
      user.artistProfile = {
        displayName: application.displayName,
        bio: application.bio,
        website: application.website,
        location: application.location,
        avatar: user.artistProfile?.avatar || "",
        banner: user.artistProfile?.banner || "",
        isArtistProfileComplete: true,
      };
    } else {
      user.artistApplicationStatus = "rejected";
    }

    await Promise.all([
      application.save(),
      user.save(),
    ]);

    await sendArtistApplicationDecisionEmail({
      email: user.email,
      username:
        user.username || application.displayName,
      displayName: application.displayName,
      status: application.status,
      adminNote,
    });

    const pendingCount = await ArtistApplication.countDocuments({
      status: "pending",
    });

    const { emitAdminEvent } = await import("@/lib/emitAdminEvent");
    await emitAdminEvent({
      event: "artist_applications:count_update",
      data: { pendingCount },
    });

    return Response.json({
      success: true,
      status: application.status,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
