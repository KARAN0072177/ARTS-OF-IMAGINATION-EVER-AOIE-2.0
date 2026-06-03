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
  const [adminNote, setAdminNote] =
    useState("");
  const [removeArtwork, setRemoveArtwork] =
    useState(false);
  const [busyAction, setBusyAction] =
    useState("");
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
            removeArtwork:
              status === "valid" && removeArtwork,
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
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Review report
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Your note is emailed to the reporter. If you remove the artwork,
            the artist receives a warning email too.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Mail className="h-4 w-4" />
          Decision email
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Marking a report valid or invalid automatically sends the reporter a
          clear outcome email.
        </p>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
        Admin reason
        <textarea
          value={adminNote}
          onChange={(event) =>
            setAdminNote(event.target.value)
          }
          rows={5}
          maxLength={800}
          disabled={disabled || Boolean(busyAction)}
          className="min-h-36 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
          placeholder="Explain the review decision."
        />
      </label>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
        <input
          type="checkbox"
          checked={removeArtwork}
          disabled={disabled || Boolean(busyAction)}
          onChange={(event) =>
            setRemoveArtwork(event.target.checked)
          }
          className="mt-1 h-4 w-4"
        />
        <span className="leading-6">
          If report is valid, remove artwork from AOIE and delete its S3 image.
        </span>
      </label>

      {error && (
        <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          disabled={disabled || Boolean(busyAction)}
          onClick={() => review("valid")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "valid" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : removeArtwork ? (
            <Trash2 className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Valid
        </button>

        <button
          type="button"
          disabled={disabled || Boolean(busyAction)}
          onClick={() => review("invalid")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "invalid" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Invalid
        </button>
      </div>
    </div>
  );
}
