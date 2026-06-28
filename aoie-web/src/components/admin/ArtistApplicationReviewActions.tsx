"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";

interface ReviewActionsProps {
  applicationId: string;
  disabled: boolean;
  status?: "pending" | "approved" | "rejected";
  adminNote?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  aiEnhanced?: boolean;
  aiModel?: string;
  promptVersion?: string;
}

export default function ArtistApplicationReviewActions({
  applicationId,
  disabled,
  status = "pending",
  adminNote: initialNote = "",
  reviewedBy,
  reviewedAt,
  aiEnhanced: initialAiEnhanced = false,
  aiModel: initialAiModel = "",
  promptVersion: initialPromptVersion = "",
}: ReviewActionsProps) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState(initialNote);
  const [busyAction, setBusyAction] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [aiAudit, setAiAudit] = useState({
    aiEnhanced: initialAiEnhanced,
    aiModel: initialAiModel,
    promptVersion: initialPromptVersion,
  });

  async function handleEnhanceWithAI() {
    if (!adminNote.trim() || isEnhancing || disabled) return;
    setIsEnhancing(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/admin/ai/enhance-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftNote: adminNote,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not enhance note with AI.");
      }

      setAdminNote(data.enhancedNote);
      setAiAudit({
        aiEnhanced: true,
        aiModel: data.aiModel || "gpt-4o-mini",
        promptVersion: data.promptVersion || "v1.0.0",
      });
      setSuccessMsg("Polished into professional SaaS decision tone ✨");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI enhancement failed.");
    } finally {
      setIsEnhancing(false);
    }
  }

  async function review(action: "approve" | "reject") {
    setBusyAction(action);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(
        `/api/admin/artist-applications/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            adminNote,
            aiEnhanced: aiAudit.aiEnhanced,
            aiModel: aiAudit.aiModel,
            promptVersion: aiAudit.promptVersion,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Review failed.");
      }

      router.refresh();
      router.push("/admin/artist-applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyAction("");
    }
  }

  if (disabled) {
    const isApproved = status === "approved";
    return (
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-5 text-slate-100">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                isApproved
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}
            >
              {isApproved ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Review Decision Audit
              </h2>
              <p className="text-xs font-bold text-slate-400">
                {isApproved ? "Application Approved" : "Application Rejected"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Recorded Note
              </p>
              {initialAiEnhanced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-black text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  AI Enhanced ({initialAiModel || "gpt-4o-mini"})
                </span>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-medium">
              {initialNote || <span className="italic text-slate-500">No admin note recorded.</span>}
            </p>
          </div>

          <div className="grid gap-2 text-xs font-medium text-slate-400 border-t border-slate-800 pt-3">
            {reviewedBy && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <UserCheck className="h-3.5 w-3.5 text-slate-500" /> Reviewed By
                </span>
                <span className="font-extrabold text-white">{reviewedBy}</span>
              </div>
            )}
            {reviewedAt && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Timestamp
                </span>
                <span className="font-mono font-bold text-slate-300">
                  {new Date(reviewedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-5 text-slate-100">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-inner">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Review Application Case
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Approving grants creator access and unlocks upload privileges on the platform.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
        <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider">
          <Mail className="h-4 w-4" /> User Email Dispatch
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400 font-medium">
          AOIE will automatically send a decision outcome email immediately after submission.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400">
            Admin Decision Note
          </label>
          <button
            type="button"
            disabled={!adminNote.trim() || isEnhancing || Boolean(busyAction)}
            onClick={handleEnhanceWithAI}
            className="group inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition"
          >
            {isEnhancing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>{isEnhancing ? "Polishing..." : "Polish with AI ✨"}</span>
          </button>
        </div>

        <textarea
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          rows={4}
          maxLength={500}
          disabled={Boolean(busyAction)}
          className="min-h-32 w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-medium text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 disabled:bg-slate-900 disabled:text-slate-500"
          placeholder="Write reason or next steps for the applicant..."
        />
      </div>

      {successMsg && (
        <p className="rounded-2xl bg-cyan-500/15 border border-cyan-500/30 p-3.5 text-xs font-bold text-cyan-300">
          {successMsg}
        </p>
      )}

      {error && (
        <p className="rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-xs font-bold text-rose-300">
          {error}
        </p>
      )}

      <div className="grid gap-3 pt-2">
        <button
          type="button"
          disabled={Boolean(busyAction)}
          onClick={() => review("approve")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyAction === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve Application
        </button>

        <button
          type="button"
          disabled={Boolean(busyAction)}
          onClick={() => review("reject")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3.5 text-xs font-extrabold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyAction === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Reject Application
        </button>
      </div>
    </div>
  );
}
