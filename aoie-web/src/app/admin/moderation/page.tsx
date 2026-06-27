import { ShieldAlert } from "lucide-react";
import { connectDB } from "@/lib/db";
import ModerationLog from "@/models/ModerationLog";
import User from "@/models/User";
import ModerationLogExplorer from "@/components/admin/ModerationLogExplorer";

void User;

export default async function AdminModerationPage() {
  await connectDB();

  const [rawLogs, totalCount, pendingCount, topCategories, topRoutes, repeatOffendersRaw] =
    await Promise.all([
      ModerationLog.find()
        .populate("user", "username email role moderationStrikes isSuspended artistProfile")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      ModerationLog.countDocuments(),
      ModerationLog.countDocuments({ reviewStatus: "pending" }),
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
            _id: { $toString: "$_id" },
            flagCount: 1,
            username: "$userInfo.username",
            email: "$userInfo.email",
            moderationStrikes: "$userInfo.moderationStrikes",
            isSuspended: "$userInfo.isSuspended",
          },
        },
      ]),
    ]);

  const logs = JSON.parse(JSON.stringify(rawLogs));
  const metrics = JSON.parse(
    JSON.stringify({
      totalCount,
      pendingCount,
      topCategories: topCategories.map((c) => ({
        category: c._id || "Unknown",
        count: c.count,
      })),
      topRoutes: topRoutes.map((r) => ({
        route: r._id || "Unknown",
        count: r.count,
      })),
      repeatOffenders: repeatOffendersRaw,
    })
  );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-rose-50 to-white p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-rose-600">
            <ShieldAlert className="h-4 w-4" />
            Trust & Safety Telemetry
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
            Automated Content Moderation
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Monitor real-time AWS Rekognition upload rejection logs, analyze threat telemetry, and execute progressive strike actions.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <ModerationLogExplorer initialLogs={logs as unknown as Parameters<typeof ModerationLogExplorer>[0]["initialLogs"]} initialMetrics={metrics} />
        </div>
      </div>
    </section>
  );
}
