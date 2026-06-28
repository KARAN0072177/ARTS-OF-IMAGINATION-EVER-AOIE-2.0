import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PlatformLog from "@/models/PlatformLog";
import User from "@/models/User";

void User;

export async function GET(req: Request) {
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

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "all";
    const severity = searchParams.get("severity") || "all";

    const query: Record<string, unknown> = {};

    if (category !== "all") {
      query.category = category;
    }

    if (severity !== "all") {
      query.severity = severity;
    }

    if (search) {
      query.$or = [
        { eventType: { $regex: search, $options: "i" } },
        { "actor.username": { $regex: search, $options: "i" } },
        { "actor.email": { $regex: search, $options: "i" } },
        { "actor.ipAddress": { $regex: search, $options: "i" } },
        { "details.attackVector": { $regex: search, $options: "i" } },
      ];
    }

    const [logsRaw, totalCount, securityIncidents, bruteForceCount, unresolvedAlerts] =
      await Promise.all([
        PlatformLog.find(query)
          .populate("actor.userId", "username email artistProfile")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        PlatformLog.countDocuments(query),
        PlatformLog.countDocuments({ severity: { $in: ["CRITICAL", "EMERGENCY"] } }),
        PlatformLog.countDocuments({ eventType: "AUTH_BRUTE_FORCE" }),
        PlatformLog.countDocuments({ isResolved: false, severity: { $in: ["CRITICAL", "EMERGENCY"] } }),
      ]);

    return Response.json({
      success: true,
      logs: logsRaw,
      metrics: {
        totalCount,
        securityIncidents,
        bruteForceCount,
        unresolvedAlerts,
      },
    });
  } catch (error) {
    console.error("Admin Activity GET Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
