import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ModerationLog from "@/models/ModerationLog";
import User from "@/models/User";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: Request, { params }: RouteProps) {
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
        { success: false, message: "Invalid moderation log ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const action = body.action as "warn" | "suspend" | "dismiss";
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 800) : "";

    if (!["warn", "suspend", "dismiss"].includes(action)) {
      return Response.json(
        { success: false, message: "Invalid action. Choose warn, suspend, or dismiss." },
        { status: 400 }
      );
    }

    await connectDB();

    const log = await ModerationLog.findById(id);
    if (!log) {
      return Response.json(
        { success: false, message: "Moderation record not found" },
        { status: 404 }
      );
    }

    const adminObjectId = new Types.ObjectId(session.user.id);
    const timestamp = new Date();

    if (action === "dismiss") {
      log.reviewStatus = "dismissed";
      log.actions.push({
        action: "dismissed",
        admin: adminObjectId,
        adminNote,
        timestamp,
      });
      await log.save();

      return Response.json({
        success: true,
        message: "Moderation log marked as dismissed.",
        log,
      });
    }

    const targetUser = await User.findById(log.user);
    if (!targetUser) {
      return Response.json(
        { success: false, message: "Target user account not found" },
        { status: 404 }
      );
    }

    if (action === "warn") {
      log.reviewStatus = "reviewed";
      log.enforcementAction = "warned";
      log.actions.push({
        action: "warned",
        admin: adminObjectId,
        adminNote,
        timestamp,
        emailTemplate: "moderation-warning-v1",
      });
      await log.save();

      targetUser.moderationStrikes = (targetUser.moderationStrikes || 0) + 1;
      await targetUser.save();

      try {
        const { sendModerationWarningEmail } = await import("@/lib/sendArtworkReportEmail");
        await sendModerationWarningEmail({
          email: targetUser.email,
          username: targetUser.username || "AOIE user",
          category: log.label,
          strikeCount: targetUser.moderationStrikes,
          adminNote,
        });
      } catch (emailErr) {
        console.error("Failed to send moderation warning email", emailErr);
      }

      return Response.json({
        success: true,
        message: `Warning logged, email dispatched to ${targetUser.email}, and strike count updated to ${targetUser.moderationStrikes}.`,
        log,
        moderationStrikes: targetUser.moderationStrikes,
      });
    }

    if (action === "suspend") {
      log.reviewStatus = "reviewed";
      log.enforcementAction = "suspended";
      log.actions.push({
        action: "suspended",
        admin: adminObjectId,
        adminNote,
        timestamp,
        emailTemplate: "moderation-suspension-v1",
      });
      await log.save();

      targetUser.moderationStrikes = (targetUser.moderationStrikes || 0) + 1;
      targetUser.isSuspended = true;
      await targetUser.save();

      try {
        const { sendModerationSuspensionEmail } = await import("@/lib/sendArtworkReportEmail");
        await sendModerationSuspensionEmail({
          email: targetUser.email,
          username: targetUser.username || "AOIE user",
          category: log.label,
          adminNote,
        });
      } catch (emailErr) {
        console.error("Failed to send moderation suspension email", emailErr);
      }

      return Response.json({
        success: true,
        message: `User account suspended and email notification sent to ${targetUser.email}.`,
        log,
        isSuspended: true,
        moderationStrikes: targetUser.moderationStrikes,
      });
    }

    return Response.json({ success: true, log });
  } catch (error) {
    console.error("Moderation PATCH Action Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
