import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ModerationLog from "@/models/ModerationLog";
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
    const filterStatus = searchParams.get("status") || "all";

    const query: Record<string, unknown> = {};
    if (filterStatus === "pending") {
      query.reviewStatus = "pending";
    } else if (filterStatus === "reviewed") {
      query.reviewStatus = "reviewed";
    } else if (filterStatus === "dismissed") {
      query.reviewStatus = "dismissed";
    }

    const [logs, totalCount, topCategories, topRoutes, repeatOffendersRaw] = await Promise.all([
      ModerationLog.find(query)
        .populate("user", "username email role moderationStrikes isSuspended artistProfile")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      ModerationLog.countDocuments(query),
      ModerationLog.aggregate([
        { $group: { _id: "$label", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      ModerationLog.aggregate([
        { $group: { _id: "$route", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      ModerationLog.aggregate([
        { $group: { _id: "$user", flagCount: { $sum: 1 } } },
        { $sort: { flagCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
        {
          $project: {
            _id: 1,
            flagCount: 1,
            username: "$userInfo.username",
            email: "$userInfo.email",
            moderationStrikes: "$userInfo.moderationStrikes",
            isSuspended: "$userInfo.isSuspended",
          },
        },
      ]),
    ]);

    const pendingCount = await ModerationLog.countDocuments({ reviewStatus: "pending" });

    return Response.json({
      success: true,
      logs,
      metrics: {
        totalCount,
        pendingCount,
        topCategories: topCategories.map((c) => ({ category: c._id || "Unknown", count: c.count })),
        topRoutes: topRoutes.map((r) => ({ route: r._id || "Unknown", count: r.count })),
        repeatOffenders: repeatOffendersRaw,
      },
    });
  } catch (error) {
    console.error("Moderation GET Endpoint Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
