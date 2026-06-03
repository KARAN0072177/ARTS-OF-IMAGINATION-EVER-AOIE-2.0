"use client";

import { useState } from "react";
import {
  Flag,
  Loader2,
  Send,
  X,
} from "lucide-react";

const reasons = [
  "Copyright or stolen artwork",
  "Explicit or unsafe content",
  "Hate or harassment",
  "Spam or misleading",
  "Other",
];

export default function ReportArtworkButton({
  artworkId,
  variant = "button",
}: {
  artworkId: string;
  variant?: "button" | "menu";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReport() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/artworks/${artworkId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
            details,
          }),
        }
      );
      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not send report."
        );
      }

      setMessage("Report sent to admin review.");
      setReason("");
      setDetails("");

      window.setTimeout(() => {
        setOpen(false);
        setMessage("");
      }, 1400);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "menu"
            ? "inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            : "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        }
      >
        <Flag className="h-4 w-4" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-600">
                  Report artwork
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Send to admin review
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close report"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Reason
                <select
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="">Choose a reason</option>
                  {reasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Details
                <textarea
                  value={details}
                  onChange={(event) =>
                    setDetails(event.target.value)
                  }
                  maxLength={1000}
                  rows={4}
                  className="resize-none rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="Add context for the admin reviewer."
                />
              </label>

              {message && (
                <div className="rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={submitReport}
                disabled={loading || !reason}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
