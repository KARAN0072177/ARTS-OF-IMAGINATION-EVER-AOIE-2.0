import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PlatformLog from "@/models/PlatformLog";

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
        { success: false, message: "Invalid log ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const log = await PlatformLog.findById(id);
    if (!log) {
      return Response.json(
        { success: false, message: "Activity log record not found" },
        { status: 404 }
      );
    }

    log.isResolved = !log.isResolved;
    log.resolvedBy = new Types.ObjectId(session.user.id);
    await log.save();

    return Response.json({
      success: true,
      message: log.isResolved
        ? "Security incident marked as resolved."
        : "Incident status reopened.",
      log,
    });
  } catch (error) {
    console.error("Admin Activity Resolve PATCH Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
