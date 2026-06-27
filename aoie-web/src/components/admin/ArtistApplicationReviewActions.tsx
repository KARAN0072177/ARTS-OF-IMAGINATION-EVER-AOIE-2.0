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

  // Render Historical Audit Record Card if application is already reviewed
  if (disabled) {
    const isApproved = status === "approved";
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                isApproved ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {isApproved ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Review Decision Audit
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {isApproved ? "Application Approved" : "Application Rejected"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Decision Note
              </p>
              {initialAiEnhanced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-800 ring-1 ring-cyan-100">
                  <Sparkles className="h-3 w-3 text-cyan-600" />
                  AI Enhanced ({initialAiModel || "gpt-4o-mini"} • {initialPromptVersion || "v1.0.0"})
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
              {initialNote || <span className="italic text-slate-400">No admin note recorded.</span>}
            </p>
          </div>

          <div className="grid gap-2 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
            {reviewedBy && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" /> Reviewed by
                </span>
                <span className="font-bold text-slate-900">{reviewedBy}</span>
              </div>
            )}
            {reviewedAt && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Review timestamp
                </span>
                <span className="font-semibold text-slate-800">
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
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Review decision</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Approving converts the user into an artist and unlocks uploads.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-cyan-900">
          <Mail className="h-4 w-4" />
          User notification
        </div>
        <p className="mt-1 text-sm leading-6 text-cyan-800/80">
          AOIE will send a polished decision email immediately after you submit.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-semibold text-slate-700">Admin note</label>
          <button
            type="button"
            disabled={!adminNote.trim() || isEnhancing || Boolean(busyAction)}
            onClick={handleEnhanceWithAI}
            className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEnhancing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-cyan-100 transition group-hover:scale-110" />
            )}
            <span>{isEnhancing ? "Polishing tone..." : "Enhance with AI ✨"}</span>
          </button>
        </div>

        <textarea
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          rows={4}
          maxLength={500}
          disabled={Boolean(busyAction)}
          className="min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
          placeholder="Write the reason or next steps for the applicant."
        />
      </div>

      {successMsg && (
        <p className="mt-3 rounded-2xl bg-cyan-50 p-3 text-xs font-semibold text-cyan-800 border border-cyan-100 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
          {successMsg}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          disabled={Boolean(busyAction)}
          onClick={() => review("approve")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </button>

        <button
          type="button"
          disabled={Boolean(busyAction)}
          onClick={() => review("reject")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Reject
        </button>
      </div>
    </div>
  );
}
