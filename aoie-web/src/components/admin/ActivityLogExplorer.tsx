"use client";

import { useEffect, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  Filter,
  Globe,
  Info,
  Key,
  Layers,
  Loader2,
  Lock,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  Wifi,
  X,
} from "lucide-react";
import { useSocket } from "@/providers/SocketProvider";

interface LogActor {
  userId?: {
    _id: string;
    username?: string;
    email?: string;
    artistProfile?: { avatar?: string };
  } | null;
  username?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface LogDetails {
  route?: string;
  method?: string;
  attackVector?: string;
  payloadSnippet?: string;
  failureCount?: number;
  metadata?: Record<string, unknown>;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
}

interface LogItem {
  _id: string;
  category: "SECURITY" | "MODERATION" | "AUTH" | "ADMIN_ACTION" | "INFRASTRUCTURE";
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
  eventType: string;
  actor: LogActor;
  details: LogDetails;
  isResolved: boolean;
  createdAt: string;
}

interface ActivityMetrics {
  totalCount: number;
  securityIncidents: number;
  bruteForceCount: number;
  unresolvedAlerts: number;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "SECURITY":
      return <ShieldAlert className="h-4 w-4 text-rose-400" />;
    case "AUTH":
      return <Key className="h-4 w-4 text-cyan-400" />;
    case "MODERATION":
      return <ShieldCheck className="h-4 w-4 text-amber-400" />;
    case "ADMIN_ACTION":
      return <User className="h-4 w-4 text-emerald-400" />;
    case "INFRASTRUCTURE":
      return <Cpu className="h-4 w-4 text-purple-400" />;
    default:
      return <Layers className="h-4 w-4 text-slate-400" />;
  }
}

function getSeverityStyle(severity: LogItem["severity"]) {
  switch (severity) {
    case "EMERGENCY":
      return {
        badge: "bg-red-500 text-white font-black tracking-wider animate-pulse ring-4 ring-red-500/30 shadow-lg shadow-red-500/50",
        border: "border-l-4 border-l-red-500 bg-red-950/20",
      };
    case "CRITICAL":
      return {
        badge: "bg-gradient-to-r from-rose-600 to-pink-600 text-white font-extrabold shadow-md shadow-rose-600/30 ring-1 ring-rose-400/50",
        border: "border-l-4 border-l-rose-500 bg-rose-950/10",
      };
    case "WARNING":
      return {
        badge: "bg-amber-500/15 text-amber-300 font-extrabold border border-amber-500/30 shadow-xs",
        border: "border-l-4 border-l-amber-400",
      };
    default:
      return {
        badge: "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30",
        border: "border-l-4 border-l-cyan-500/40",
      };
  }
}

export default function ActivityLogExplorer({
  initialLogs,
  initialMetrics,
}: {
  initialLogs: LogItem[];
  initialMetrics: ActivityMetrics;
}) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [metrics, setMetrics] = useState<ActivityMetrics>(initialMetrics);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    if (!socket.connected) socket.connect();

    socket.emit("join_admin_global");

    const handleActivityLog = () => {
      fetchLogs();
    };

    const handleIncidentAlert = (data: { eventType: string; severity: string; ipAddress?: string }) => {
      setSecurityToast(
        `🚨 HIGH THREAT ALERT: ${data.eventType} triggered from IP ${data.ipAddress || "Unknown"}`
      );
      fetchLogs();
    };

    socket.on("platform_activity_logged", handleActivityLog);
    socket.on("platform_security_incident", handleIncidentAlert);

    return () => {
      socket.off("platform_activity_logged", handleActivityLog);
      socket.off("platform_security_incident", handleIncidentAlert);
    };
  }, [socket]);

  async function fetchLogs(
    cat = filterCategory,
    sev = filterSeverity,
    query = searchTerm
  ) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat !== "all") params.set("category", cat);
      if (sev !== "all") params.set("severity", sev);
      if (query.trim()) params.set("search", query.trim());

      const response = await fetch(`/api/admin/activity?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleResolve(logId: string) {
    setActionId(logId);
    try {
      const response = await fetch(`/api/admin/activity/${logId}/resolve`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (data.success) {
        fetchLogs();
        if (selectedLog?._id === logId) {
          setSelectedLog({ ...selectedLog, isResolved: !selectedLog.isResolved });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  }

  const copyPayloadToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Real-time Emergency Security Incident Banner (Glass Neon Glow) */}
      {securityToast && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/90 via-rose-950/90 to-red-900/90 p-5 text-white shadow-2xl shadow-red-600/30 backdrop-blur-2xl border border-red-500/40 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/30 shadow-inner">
                <AlertOctagon className="h-6 w-6 text-red-400 animate-bounce" />
              </span>
              <div>
                <span className="inline-block rounded-full bg-red-500/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-200 border border-red-400/30">
                  Critical Defense Protocol
                </span>
                <p className="mt-1 text-base font-extrabold tracking-tight text-white">{securityToast}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setSecurityToast(null)}
                className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 border border-white/10"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Futuristic 2026 Dark Glassmorphism SOC Telemetry Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Audit Pipeline */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/10">
          <div className="absolute top-0 right-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-cyan-500/10 to-transparent transition duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Terminal className="h-6 w-6" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-extrabold text-cyan-300 border border-cyan-500/20">
              <Wifi className="h-3 w-3 animate-pulse text-cyan-400" /> Live Pipeline
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Audit Logs</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-white">{metrics.totalCount}</p>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div className="h-full w-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/50" />
          </div>
        </div>

        {/* Card 2: Security Threats */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-rose-500/10">
          <div className="absolute top-0 right-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-rose-500/10 to-transparent transition duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-500/30 shadow-inner">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-extrabold text-rose-300 border border-rose-500/20">
              High Severity
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Security Threats</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-white">{metrics.securityIncidents}</p>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div className="h-full w-3/4 bg-gradient-to-r from-rose-500 to-pink-500 shadow-sm shadow-rose-500/50" />
          </div>
        </div>

        {/* Card 3: Brute-Force Attacks */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-amber-500/10">
          <div className="absolute top-0 right-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-amber-500/10 to-transparent transition duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-500/30 shadow-inner">
              <Lock className="h-6 w-6" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-extrabold text-amber-300 border border-amber-500/20">
              Auth Defense
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Brute-Force Detections</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-white">{metrics.bruteForceCount}</p>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div className="h-full w-1/2 bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm shadow-amber-500/50" />
          </div>
        </div>

        {/* Card 4: Unresolved Telemetry */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-purple-500/10">
          <div className="absolute top-0 right-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-purple-500/10 to-transparent transition duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-950/80 text-purple-400 border border-purple-500/30 shadow-inner">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-[11px] font-extrabold text-purple-300 border border-purple-500/20">
              Open Queue
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Unresolved Incidents</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-white">{metrics.unresolvedAlerts}</p>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-sm shadow-purple-500/50" />
          </div>
        </div>
      </div>

      {/* Cyber Control Bar & Filter Radar (Dark Glass) */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchLogs(filterCategory, filterSeverity, e.target.value);
              }}
              placeholder="Search event type, attacker IP, vector, or targeted user..."
              className="w-full rounded-full border border-slate-800 bg-slate-950/80 pl-11 pr-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 outline-none transition duration-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs font-bold text-slate-300">
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>SOC Radar Operational</span>
            </div>

            <button
              type="button"
              onClick={() => fetchLogs(filterCategory, filterSeverity, searchTerm)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-800/80 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-700 hover:border-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              Refresh Feed
            </button>
          </div>
        </div>

        {/* Category Radar Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/60">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="h-3 w-3 text-cyan-400" /> Domain:
          </span>
          {["all", "SECURITY", "AUTH", "MODERATION", "ADMIN_ACTION", "INFRASTRUCTURE"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setFilterCategory(cat);
                fetchLogs(cat, filterSeverity, searchTerm);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold capitalize transition duration-200 ${
                filterCategory === cat
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400/50"
                  : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              {cat === "all" ? "All Domains" : cat.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-2">Severity:</span>
          {["all", "EMERGENCY", "CRITICAL", "WARNING", "INFO"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => {
                setFilterSeverity(sev);
                fetchLogs(filterCategory, sev, searchTerm);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold capitalize transition duration-200 ${
                filterSeverity === sev
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/50"
                  : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              {sev === "all" ? "All Levels" : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Cyber Activity Log Stream Table (Dark Glass Container) */}
      <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Event Telemetry</th>
                <th className="px-6 py-4">Target Account</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Security Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => {
                const style = getSeverityStyle(log.severity);
                return (
                  <tr key={log._id} className={`transition duration-200 hover:bg-slate-800/50 ${style.border}`}>
                    <td className="px-6 py-4.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
                          {getCategoryIcon(log.category)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] ${style.badge}`}>
                              {log.severity}
                            </span>
                            <span className="font-extrabold text-white tracking-tight">{log.eventType}</span>
                          </div>
                          {log.details.attackVector && (
                            <p className="mt-0.5 text-xs font-semibold text-rose-400 truncate max-w-xs">
                              {log.details.attackVector}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4.5">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {log.actor.username || log.actor.email || "System Automated"}
                        </p>
                        <p className="truncate text-xs font-mono text-slate-400">{log.details.route || log.category}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4.5 font-mono text-xs text-slate-300">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 font-bold border border-slate-800">
                        <Globe className="h-3 w-3 text-cyan-400" />
                        {log.actor.ipAddress || "127.0.0.1"}
                      </span>
                    </td>

                    <td className="px-6 py-4.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
                          log.isResolved
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${log.isResolved ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
                        {log.isResolved ? "Resolved" : "Active Threat"}
                      </span>
                    </td>

                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-extrabold text-white transition duration-200 hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
                        >
                          Inspect <ArrowUpRight className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={actionId === log._id}
                          onClick={() => handleToggleResolve(log._id)}
                          className={`rounded-xl p-2 transition duration-200 border ${
                            log.isResolved
                              ? "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                          }`}
                          title={log.isResolved ? "Reopen Alert" : "Mark Resolved"}
                        >
                          {actionId === log._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cyber Ops Slide-Over Inspection Drawer (Obsidian Glass Theme) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-950/95 text-slate-100 p-6 sm:p-8 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200 border-l border-slate-800 backdrop-blur-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-xs ${getSeverityStyle(selectedLog.severity).badge}`}>
                    {selectedLog.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedLog._id}</span>
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{selectedLog.eventType}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-2xl bg-slate-900 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white border border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 5W Forensic Metadata Grid */}
            <div className="space-y-3 rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 text-sm shadow-inner">
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Category Domain</span>
                <span className="font-extrabold text-cyan-400">{selectedLog.category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Target Account</span>
                <span className="font-bold text-white">
                  {selectedLog.actor.username || selectedLog.actor.email || "Anonymous / Automated"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Attacker / Client IP</span>
                <span className="font-mono font-extrabold text-emerald-400">{selectedLog.actor.ipAddress || "127.0.0.1"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Target Route & Method</span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {selectedLog.details.method || "POST"} {selectedLog.details.route || "/api/auth"}
                </span>
              </div>
              {selectedLog.details.attackVector && (
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-semibold text-slate-400">Attack Vector</span>
                  <span className="font-extrabold text-rose-400">{selectedLog.details.attackVector}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Recorded Timestamp</span>
                <span className="font-semibold text-slate-300">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" /> Forensic Payload Snippet
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    copyPayloadToClipboard(
                      selectedLog.details.payloadSnippet ||
                        JSON.stringify(selectedLog.details.metadata || selectedLog.details.changes || {}, null, 2)
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-400 transition"
                >
                  <Copy className="h-3.5 w-3.5" /> {copiedPayload ? "Copied!" : "Copy Snippet"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800 p-4 text-xs font-mono text-cyan-300 leading-relaxed shadow-inner">
                {selectedLog.details.payloadSnippet ||
                  JSON.stringify(selectedLog.details.metadata || selectedLog.details.changes || {}, null, 2)}
              </pre>
            </div>

            {/* Drawer Action Bar */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={actionId === selectedLog._id}
                onClick={() => handleToggleResolve(selectedLog._id)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-extrabold transition duration-200 ${
                  selectedLog.isResolved
                    ? "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25"
                }`}
              >
                {actionId === selectedLog._id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : selectedLog.isResolved ? (
                  "Reopen Threat Alert"
                ) : (
                  "Mark Security Threat as Resolved"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
