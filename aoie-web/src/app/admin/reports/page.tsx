import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";

import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import ArtworkReport from "@/models/ArtworkReport";
import User from "@/models/User";

void Artwork;
void User;

type ReportItem = {
  _id: {
    toString(): string;
  };
  reason: string;
  status: "pending" | "valid" | "invalid";
  actionTaken: "none" | "artwork_removed";
  createdAt: Date;
  artwork?: {
    title?: string;
  } | null;
  reporter?: {
    username?: string | null;
    email?: string;
  } | null;
};

function statusStyle(status: ReportItem["status"]) {
  if (status === "valid") {
    return {
      label: "Valid",
      className:
        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      icon: CheckCircle2,
    };
  }

  if (status === "invalid") {
    return {
      label: "Invalid",
      className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      icon: XCircle,
    };
  }

  return {
    label: "Pending",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    icon: Clock,
  };
}

export default async function AdminReportsPage() {
  await connectDB();

  const rawReports = (await ArtworkReport.find()
    .populate("artwork", "title")
    .populate("reporter", "username email")
    .sort({
      createdAt: -1,
    })
    .lean()) as unknown as ReportItem[];

  const statusWeight: Record<string, number> = {
    pending: 1,
    valid: 2,
    invalid: 3,
  };

  const reports = [...rawReports].sort((a, b) => {
    const weightA = statusWeight[a.status] || 99;
    const weightB = statusWeight[b.status] || 99;
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = reports.filter(
    (report) => report.status === "pending"
  ).length;
  const validCount = reports.filter(
    (report) => report.status === "valid"
  ).length;
  const removedCount = reports.filter(
    (report) =>
      report.actionTaken === "artwork_removed"
  ).length;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-rose-50 to-white p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-rose-600">
            <Flag className="h-4 w-4" />
            Moderation
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                Artwork reports
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Review reported artwork, decide whether the report is valid,
                and remove harmful content with user-facing email updates.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[420px]">
              <div className="rounded-2xl border border-rose-200 bg-white p-3">
                <p className="text-xs font-bold text-rose-700">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-3">
                <p className="text-xs font-bold text-emerald-700">
                  Valid
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {validCount}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold text-slate-600">
                  Removed
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {removedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold">
              No reports yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              User-submitted artwork reports will appear in this queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => {
              const status = statusStyle(report.status);
              const StatusIcon = status.icon;

              return (
                <Link
                  key={report._id.toString()}
                  href={`/admin/reports/${report._id.toString()}`}
                  className="group grid gap-4 p-5 transition hover:bg-slate-50 lg:grid-cols-[1fr_220px_160px_32px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-extrabold text-slate-950">
                        {report.artwork?.title ||
                          "Removed artwork"}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                      {report.actionTaken ===
                        "artwork_removed" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-700 ring-1 ring-rose-100">
                          <Trash2 className="h-3.5 w-3.5" />
                          Removed
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {report.reason}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">
                      Reported by
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {report.reporter?.username ||
                        report.reporter?.email ||
                        "AOIE user"}
                    </p>
                  </div>

                  <div className="text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">
                      Submitted
                    </p>
                    <p>
                      {new Date(
                        report.createdAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-rose-600" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
