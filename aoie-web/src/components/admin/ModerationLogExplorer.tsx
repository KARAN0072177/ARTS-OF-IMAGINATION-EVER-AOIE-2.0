"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  UserX,
  X,
} from "lucide-react";

interface LogUser {
  _id: string;
  username?: string | null;
  email: string;
  role: string;
  moderationStrikes?: number;
  isSuspended?: boolean;
  artistProfile?: {
    avatar?: string;
  };
}

interface ActionEntry {
  action: string;
  adminNote?: string;
  timestamp: string;
  emailTemplate?: string;
}

interface LogItem {
  _id: string;
  user?: LogUser | null;
  route: string;
  label: string;
  parentCategory?: string;
  confidence: number;
  appliedThreshold: number;
  fileSize: number;
  fileType: string;
  provider: string;
  providerVersion: string;
  decision: string;
  reviewStatus: "pending" | "reviewed" | "dismissed";
  enforcementAction?: "warned" | "suspended" | null;
  actions?: ActionEntry[];
  createdAt: string;
}

interface AnalyticsMetrics {
  totalCount: number;
  pendingCount: number;
  topCategories: { category: string; count: number }[];
  topRoutes: { route: string; count: number }[];
  repeatOffenders: {
    _id: string;
    flagCount: number;
    username?: string;
    email: string;
    moderationStrikes?: number;
    isSuspended?: boolean;
  }[];
}

function renderFormattedNote(rawNote: string) {
  if (!rawNote) return null;

  const cleaned = rawNote
    .replace(/^Subject:\s*.*$/gm, "")
    .replace(/^Dear\s+[^,\n]+,?\s*/gm, "")
    .trim();

  const lines = cleaned.split("\n");
  const blocks: React.ReactNode[] = [];
  let currentBulletItems: React.ReactNode[] = [];

  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-extrabold text-cyan-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBulletItems.length > 0) {
        blocks.push(
          <ul key={`ul-${index}`} className="my-2 space-y-1 pl-4 list-disc text-slate-300">
            {currentBulletItems}
          </ul>
        );
        currentBulletItems = [];
      }
      return;
    }

    const bulletMatch = trimmed.match(/^[-•*]\s*(.*)$/);
    if (bulletMatch) {
      currentBulletItems.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseInlineBold(bulletMatch[1])}
        </li>
      );
    } else {
      if (currentBulletItems.length > 0) {
        blocks.push(
          <ul key={`ul-${index}`} className="my-2 space-y-1 pl-4 list-disc text-slate-300">
            {currentBulletItems}
          </ul>
        );
        currentBulletItems = [];
      }

      if (trimmed.includes("- Team AOIE")) {
        blocks.push(
          <p key={`p-${index}`} className="mt-3 font-extrabold text-cyan-400">
            {trimmed}
          </p>
        );
      } else {
        blocks.push(
          <p key={`p-${index}`} className="my-1 leading-relaxed text-slate-300">
            {parseInlineBold(trimmed)}
          </p>
        );
      }
    }
  });

  if (currentBulletItems.length > 0) {
    blocks.push(
      <ul key="ul-final" className="my-2 space-y-1 pl-4 list-disc text-slate-300">
        {currentBulletItems}
      </ul>
    );
  }

  return <div className="space-y-1 text-xs">{blocks}</div>;
}

export default function ModerationLogExplorer({
  initialLogs,
  initialMetrics,
}: {
  initialLogs: LogItem[];
  initialMetrics: AnalyticsMetrics;
}) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(initialMetrics);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleEnhanceWithAI() {
    if (!actionNote.trim() || isEnhancing || isProcessing) return;
    setIsEnhancing(true);
    setFeedback("");

    try {
      const response = await fetch("/api/admin/ai/enhance-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftNote: actionNote,
          actionContext: "moderation",
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not enhance operational note.");
      }

      setActionNote(data.enhancedNote);
      setFeedback("Polished operational decision into bulleted SaaS enforcement note ✨");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "AI enhancement failed.");
    } finally {
      setIsEnhancing(false);
    }
  }

  async function fetchLogs(status = filterStatus) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/moderation?status=${status}`);
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

  async function handleEnforcementAction(action: "warn" | "suspend" | "dismiss") {
    if (!selectedLog || isProcessing) return;
    setIsProcessing(true);
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/moderation/${selectedLog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNote: actionNote,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to execute action.");
      }

      setFeedback(data.message || "Enforcement action recorded.");
      setActionNote("");
      setSelectedLog(null);
      fetchLogs(filterStatus);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error executing action.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Analytics Telemetry Overview (Dark Glass Tiles) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl transition hover:border-rose-500/50">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-500/30 shadow-inner">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Total Flagged
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {metrics.totalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="group rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl transition hover:border-amber-500/50">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-500/30 shadow-inner">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-400">
                Pending Review
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {metrics.pendingCount}
              </p>
            </div>
          </div>
        </div>

        <div className="group rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl transition hover:border-cyan-500/50">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <BarChart2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Top Category
              </p>
              <p className="mt-1 truncate text-base font-black text-white">
                {metrics.topCategories[0]?.category || "None"} ({metrics.topCategories[0]?.count || 0})
              </p>
            </div>
          </div>
        </div>

        <div className="group rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl transition hover:border-purple-500/50">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-950/80 text-purple-400 border border-purple-500/30 shadow-inner">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-purple-400">
                Repeat Offenders
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {metrics.repeatOffenders.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Breakdown Cards (Dark Glass) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl">
          <h3 className="flex items-center gap-2 text-sm font-black text-white">
            <Layers className="h-4 w-4 text-cyan-400" />
            Top Trigger Categories
          </h3>
          <div className="mt-4 divide-y divide-slate-800/60">
            {metrics.topCategories.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-bold text-slate-200">{cat.category}</span>
                <span className="rounded-full bg-slate-950 border border-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300">
                  {cat.count} flags
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl">
          <h3 className="flex items-center gap-2 text-sm font-black text-white">
            <Filter className="h-4 w-4 text-cyan-400" />
            Top Triggering Endpoints
          </h3>
          <div className="mt-4 divide-y divide-slate-800/60">
            {metrics.topRoutes.map((r) => (
              <div key={r.route} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-mono text-xs font-bold text-slate-300">{r.route}</span>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                  {r.count} uploads
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl">
          <h3 className="flex items-center gap-2 text-sm font-black text-white">
            <UserX className="h-4 w-4 text-rose-400" />
            Repeat Policy Offenders
          </h3>
          <div className="mt-4 divide-y divide-slate-800/60">
            {metrics.repeatOffenders.map((user) => (
              <div key={user._id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-white">
                    {user.username || "Username pending"}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    Strikes: {user.moderationStrikes || 0} {user.isSuspended && "• Suspended"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-xs font-black text-rose-300">
                  {user.flagCount} flags
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-cyan-950/80 p-4 text-sm font-bold text-cyan-300 border border-cyan-500/40 backdrop-blur-md">
          <Info className="h-4 w-4 text-cyan-400" />
          {feedback}
        </div>
      )}

      {/* Filter Tabs & Data Table (Dark Glass Container) */}
      <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 p-4 sm:p-6 bg-slate-950/40">
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "reviewed", "dismissed"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setFilterStatus(st);
                  fetchLogs(st);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-extrabold capitalize transition ${
                  filterStatus === st
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30"
                    : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchLogs(filterStatus)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-800/80 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            Refresh Telemetry
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/90 text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Uploader / User</th>
                <th className="px-6 py-4">Category / Label</th>
                <th className="px-6 py-4">Confidence / Threshold</th>
                <th className="px-6 py-4">Endpoint / Route</th>
                <th className="px-6 py-4">Review Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-extrabold">
                    No moderation telemetry entries found for this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="transition hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {log.user?.artistProfile?.avatar ? (
                          <img
                            src={log.user.artistProfile.avatar}
                            alt={log.user.username || "Avatar"}
                            className="h-9 w-9 shrink-0 rounded-xl object-cover border border-slate-700"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400 font-bold text-xs">
                            <User className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-extrabold text-white">
                            {log.user?.username || "Username pending"}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400">
                            Strikes: {log.user?.moderationStrikes || 0}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-extrabold text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                        {log.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-200">
                      <div>
                        <span>{log.confidence}%</span>
                        <span className="text-xs font-normal text-slate-400"> / {log.appliedThreshold}% max</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {log.route}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold capitalize border ${
                          log.reviewStatus === "pending"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : log.reviewStatus === "reviewed"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {log.reviewStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
                      >
                        Inspect Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Obsidian Glass Slide-Over Inspection Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-950/95 text-slate-100 p-6 sm:p-8 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200 border-l border-slate-800 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">Moderation Forensic Details</h3>
                <p className="text-xs font-mono text-slate-400">Log ID: {selectedLog._id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-2xl bg-slate-900 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white border border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Account Username</span>
                <span className="font-black text-white">{selectedLog.user?.username || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Account Email</span>
                <span className="font-mono font-bold text-cyan-300">{selectedLog.user?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Flagged Label</span>
                <span className="font-extrabold text-rose-400">{selectedLog.label}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Confidence Match</span>
                <span className="font-bold text-white">
                  {selectedLog.confidence}% (Threshold: {selectedLog.appliedThreshold}%)
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2.5">
                <span className="font-semibold text-slate-400">Moderation Provider</span>
                <span className="font-bold text-slate-300">
                  {selectedLog.provider} (v{selectedLog.providerVersion})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Flagged Timestamp</span>
                <span className="font-semibold text-slate-300">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Note Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Operational Enforcement Note
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancing || !actionNote.trim()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Polish with AI
                </button>
              </div>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter admin note or policy context for the user..."
                className="w-full h-28 rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 text-xs font-medium text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
              />
            </div>

            {/* Enforcement Buttons */}
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleEnforcementAction("warn")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 px-4 py-3 text-sm font-black text-amber-300 transition hover:bg-amber-500/30 shadow-lg shadow-amber-500/10"
              >
                Issue Official Warning Strike
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleEnforcementAction("suspend")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-500 shadow-lg shadow-rose-600/25"
              >
                Suspend User Account Access
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleEnforcementAction("dismiss")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-slate-300 transition hover:bg-slate-800"
              >
                Dismiss False Positive Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
