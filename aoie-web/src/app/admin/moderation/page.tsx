import { ShieldAlert, Sparkles } from "lucide-react";
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
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20 text-slate-100">
        {/* Cyber Hero Banner Header */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-rose-400 border border-rose-500/30 backdrop-blur-md shadow-inner">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Trust & Safety Operations
                </span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                Automated Content Moderation <Sparkles className="h-6 w-6 text-rose-400" />
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                Monitor real-time AWS Rekognition upload rejection logs, analyze threat telemetry, and execute progressive strike actions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-slate-950/40">
          <ModerationLogExplorer initialLogs={logs as unknown as Parameters<typeof ModerationLogExplorer>[0]["initialLogs"]} initialMetrics={metrics} />
        </div>
      </div>
    </section>
  );
}
