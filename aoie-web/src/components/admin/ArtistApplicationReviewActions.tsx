"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  Loader2,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

export default function ArtistApplicationReviewActions({
  applicationId,
  disabled,
}: {
  applicationId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [adminNote, setAdminNote] =
    useState("");
  const [busyAction, setBusyAction] =
    useState("");
  const [error, setError] = useState("");

  async function review(
    action: "approve" | "reject"
  ) {
    setBusyAction(action);
    setError("");

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
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Review failed."
        );
      }

      router.refresh();
      router.push("/admin/artist-applications");
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
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Review decision
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Approving converts the user into an artist and unlocks uploads.
            The note is included in the decision email.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-cyan-900">
          <Mail className="h-4 w-4" />
          User notification
        </div>
        <p className="mt-1 text-sm leading-6 text-cyan-800/80">
          AOIE will send a polished approval or rejection email immediately
          after you submit the decision.
        </p>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
        Admin note
        <textarea
          value={adminNote}
          onChange={(event) =>
            setAdminNote(event.target.value)
          }
          rows={4}
          maxLength={500}
          disabled={disabled || Boolean(busyAction)}
          className="min-h-32 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
          placeholder="Write the reason or next steps for the applicant."
        />
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
          disabled={disabled || Boolean(busyAction)}
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
