import { Radio, ShieldAlert, Terminal } from "lucide-react";
import { connectDB } from "@/lib/db";
import PlatformLog from "@/models/PlatformLog";
import User from "@/models/User";
import ActivityLogExplorer from "@/components/admin/ActivityLogExplorer";

void User;

export default async function AdminActivityPage() {
  await connectDB();

  const [logsRaw, totalCount, securityIncidents, bruteForceCount, unresolvedAlerts] =
    await Promise.all([
      PlatformLog.find()
        .populate("actor.userId", "username email artistProfile")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      PlatformLog.countDocuments(),
      PlatformLog.countDocuments({ severity: { $in: ["CRITICAL", "EMERGENCY"] } }),
      PlatformLog.countDocuments({ eventType: "AUTH_BRUTE_FORCE" }),
      PlatformLog.countDocuments({ isResolved: false, severity: { $in: ["CRITICAL", "EMERGENCY"] } }),
    ]);

  const logs = JSON.parse(JSON.stringify(logsRaw));
  const metrics = JSON.parse(
    JSON.stringify({
      totalCount,
      securityIncidents,
      bruteForceCount,
      unresolvedAlerts,
    })
  );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20 text-slate-100">
        {/* Cyber Glass Hero Header */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-inner">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  SOC SOC-2026 Telemetry
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-400" /> Live Radar Active
                </span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">
                Cyber Operations & Threat Radar
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                Platform-wide SOC telemetry, real-time cyber attack vectors, brute-force surgers, and immutable security audit stream.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-3 self-center rounded-2xl bg-slate-900/80 p-4 border border-slate-800/80 backdrop-blur-md shadow-xl">
              <ShieldAlert className="h-10 w-10 text-rose-400 animate-pulse" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Zero-Trust SOC</p>
                <p className="text-sm font-extrabold text-white">WebSocket Real-Time Stream</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-slate-950/40">
          <ActivityLogExplorer initialLogs={logs} initialMetrics={metrics} />
        </div>
      </div>
    </section>
  );
}
