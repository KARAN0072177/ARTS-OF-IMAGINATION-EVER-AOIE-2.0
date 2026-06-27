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
          <strong key={idx} className="font-extrabold text-slate-950">
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
          <ul key={`ul-${index}`} className="my-2 space-y-1 pl-4 list-disc text-slate-700">
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
          <ul key={`ul-${index}`} className="my-2 space-y-1 pl-4 list-disc text-slate-700">
            {currentBulletItems}
          </ul>
        );
        currentBulletItems = [];
      }

      if (trimmed.includes("- Team AOIE")) {
        blocks.push(
          <p key={`p-${index}`} className="mt-3 font-extrabold text-cyan-700">
            {trimmed}
          </p>
        );
      } else {
        blocks.push(
          <p key={`p-${index}`} className="my-1 leading-relaxed text-slate-700">
            {parseInlineBold(trimmed)}
          </p>
        );
      }
    }
  });

  if (currentBulletItems.length > 0) {
    blocks.push(
      <ul key="ul-final" className="my-2 space-y-1 pl-4 list-disc text-slate-700">
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
    <div className="space-y-6">
      {/* Analytics Telemetry Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Total Flagged
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {metrics.totalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                Pending Review
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {metrics.pendingCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <BarChart2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">
                Top Category
              </p>
              <p className="mt-1 truncate text-base font-extrabold text-slate-950">
                {metrics.topCategories[0]?.category || "None"} ({metrics.topCategories[0]?.count || 0})
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-purple-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                Repeat Offenders
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {metrics.repeatOffenders.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Breakdown Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Layers className="h-4 w-4 text-cyan-600" />
            Top Trigger Categories
          </h3>
          <div className="mt-4 divide-y divide-slate-100">
            {metrics.topCategories.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold text-slate-700">{cat.category}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {cat.count} flags
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Filter className="h-4 w-4 text-cyan-600" />
            Top Triggering Endpoints
          </h3>
          <div className="mt-4 divide-y divide-slate-100">
            {metrics.topRoutes.map((r) => (
              <div key={r.route} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs font-bold text-slate-600">{r.route}</span>
                <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-800">
                  {r.count} uploads
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <UserX className="h-4 w-4 text-rose-600" />
            Repeat Policy Offenders
          </h3>
          <div className="mt-4 divide-y divide-slate-100">
            {metrics.repeatOffenders.map((user) => (
              <div key={user._id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">
                    {user.username || "Username pending"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Strikes: {user.moderationStrikes || 0} {user.isSuspended && "• Suspended"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-800">
                  {user.flagCount} flags
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-cyan-50 p-4 text-sm font-bold text-cyan-900 border border-cyan-200">
          <Info className="h-4 w-4 text-cyan-600" />
          {feedback}
        </div>
      )}

      {/* Filter Tabs & Data Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 sm:p-6">
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
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchLogs(filterStatus)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
            Refresh telemetry
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Uploader / User</th>
                <th className="px-6 py-4">Category / Label</th>
                <th className="px-6 py-4">Confidence / Threshold</th>
                <th className="px-6 py-4">Endpoint / Route</th>
                <th className="px-6 py-4">Review Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                    No moderation telemetry entries found for this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {log.user?.artistProfile?.avatar ? (
                          <img
                            src={log.user.artistProfile.avatar}
                            alt={log.user.username || "Avatar"}
                            className="h-9 w-9 shrink-0 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                            <User className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-950">
                            {log.user?.username || "Username pending"}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-400">
                            Strikes: {log.user?.moderationStrikes || 0}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-700 ring-1 ring-rose-100">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {log.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div>
                        <span>{log.confidence}%</span>
                        <span className="text-xs font-normal text-slate-400"> / {log.appliedThreshold}% max</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {log.route}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize ${
                          log.reviewStatus === "pending"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            : log.reviewStatus === "reviewed"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {log.reviewStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-cyan-700"
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

      {/* Slide-over Inspection & Enforcement Action Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">Moderation Telemetry Log</h3>
                <p className="text-xs font-semibold text-slate-500">ID: {selectedLog._id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Uploader User</span>
                <div className="text-right">
                  <p className="font-bold text-slate-950">{selectedLog.user?.username || "Username pending"}</p>
                  <p className="text-xs font-mono text-slate-500">{selectedLog.user?.email || "No email"}</p>
                </div>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Flagged Category / Label</span>
                <span className="font-bold text-rose-700">
                  {selectedLog.label}
                  {selectedLog.parentCategory && selectedLog.parentCategory !== selectedLog.label ? ` (${selectedLog.parentCategory})` : ""}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Confidence Metric</span>
                <span className="font-bold text-slate-900">{selectedLog.confidence}% (Threshold: {selectedLog.appliedThreshold}%)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Provider Telemetry</span>
                <span className="font-mono text-xs text-slate-700">{selectedLog.provider} • {selectedLog.providerVersion}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">File Size & Format</span>
                <span className="font-semibold text-slate-800">{(selectedLog.fileSize / 1024).toFixed(1)} KB ({selectedLog.fileType})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Timestamp</span>
                <span className="font-semibold text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Immutable Action History */}
            {selectedLog.actions && selectedLog.actions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900">Immutable Audit History</h4>
                <div className="space-y-2">
                  {selectedLog.actions.map((act, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="capitalize">{act.action}</span>
                        <span className="font-normal text-slate-500">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      {act.adminNote && (
                        <div className="mt-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 font-normal">
                          {renderFormattedNote(act.adminNote)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execute Idempotent Enforcement Action */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-slate-900">Execute Enforcement Action</h4>
                <button
                  type="button"
                  disabled={!actionNote.trim() || isEnhancing || isProcessing}
                  onClick={handleEnhanceWithAI}
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isEnhancing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-rose-100 transition group-hover:scale-110" />
                  )}
                  <span>{isEnhancing ? "Structuring note..." : "Enhance with AI ✨"}</span>
                </button>
              </div>

              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={5}
                disabled={isProcessing || isEnhancing}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                placeholder="Write operational notes explaining this enforcement decision..."
              />

              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleEnforcementAction("warn")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Issue Strike 1 Warning Email
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleEnforcementAction("suspend")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                  Suspend User Account
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleEnforcementAction("dismiss")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Dismiss as False Positive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
