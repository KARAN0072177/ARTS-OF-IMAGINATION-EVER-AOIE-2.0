"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  Mail,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

export default function ArtworkReportReviewActions({
  reportId,
  disabled,
}: {
  reportId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState("");
  const [removeArtwork, setRemoveArtwork] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  async function review(status: "valid" | "invalid") {
    setBusyAction(status);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/reports/${reportId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            adminNote,
            removeArtwork: status === "valid" && removeArtwork,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not review report."
        );
      }

      router.refresh();
      router.push("/admin/reports");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setBusyAction("");
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-5 text-slate-100">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-500/30 shadow-inner">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Review Report Case
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Your decision note is emailed to the reporter. If you mark valid and remove the artwork, the artist receives an enforcement email as well.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
        <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider">
          <Mail className="h-4 w-4" /> Decision Dispatch Enabled
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400 font-medium">
          Executing a decision automatically dispatches an automated outcome email to active participants.
        </p>
      </div>

      <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        Admin Decision Reason
        <textarea
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          rows={5}
          maxLength={800}
          disabled={disabled || Boolean(busyAction)}
          className="min-h-36 resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-medium text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 disabled:bg-slate-900 disabled:text-slate-500"
          placeholder="Explain the review decision..."
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/50 p-4 text-xs font-bold text-rose-300 cursor-pointer hover:bg-rose-950">
        <input
          type="checkbox"
          checked={removeArtwork}
          disabled={disabled || Boolean(busyAction)}
          onChange={(event) => setRemoveArtwork(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-900 text-rose-500 focus:ring-rose-500"
        />
        <span className="leading-relaxed">
          If report is valid, permanently remove artwork from AOIE gallery and purge S3 assets.
        </span>
      </label>

      {error && (
        <p className="rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-xs font-bold text-rose-300">
          {error}
        </p>
      )}

      <div className="grid gap-3 pt-2">
        <button
          type="button"
          disabled={disabled || Boolean(busyAction)}
          onClick={() => review("valid")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyAction === "valid" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : removeArtwork ? (
            <Trash2 className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Mark Report as Valid
        </button>

        <button
          type="button"
          disabled={disabled || Boolean(busyAction)}
          onClick={() => review("invalid")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3.5 text-xs font-extrabold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyAction === "invalid" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Dismiss as Invalid
        </button>
      </div>
    </div>
  );
}
