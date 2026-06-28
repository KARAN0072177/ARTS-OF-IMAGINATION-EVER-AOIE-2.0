import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  ShieldAlert,
  Sparkles,
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
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black",
      icon: CheckCircle2,
    };
  }

  if (status === "invalid") {
    return {
      label: "Invalid",
      className: "bg-slate-800 text-slate-400 border border-slate-700 font-bold",
      icon: XCircle,
    };
  }

  return {
    label: "Pending",
    className: "bg-rose-500/15 text-rose-300 border border-rose-500/30 font-black animate-pulse",
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

  const reports = [...rawReports].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = reports.filter(
    (report) => report.status === "pending"
  ).length;
  const validCount = reports.filter(
    (report) => report.status === "valid"
  ).length;
  const removedCount = reports.filter(
    (report) => report.actionTaken === "artwork_removed"
  ).length;

  return (
    <section className="space-y-6 text-slate-100">
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        {/* Dark Glass Hero Banner */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-rose-400 border border-rose-500/30 backdrop-blur-md shadow-inner">
                <Flag className="h-3.5 w-3.5 text-rose-400" />
                Moderation Queue
              </p>
              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                Artwork Reports <Sparkles className="h-6 w-6 text-rose-400" />
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                Review reported artwork, decide whether the report is valid, and remove harmful content with automated user-facing email updates.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:w-[440px]">
              <div className="rounded-3xl border border-rose-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-rose-400 tracking-wider">Pending</p>
                <p className="mt-1 text-3xl font-black text-white">{pendingCount}</p>
              </div>
              <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-emerald-400 tracking-wider">Valid</p>
                <p className="mt-1 text-3xl font-black text-white">{validCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Removed</p>
                <p className="mt-1 text-3xl font-black text-white">{removedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="p-16 text-center bg-slate-950/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 text-rose-400">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black text-white">No reports yet</h2>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              User-submitted artwork reports will appear in this queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 bg-slate-950/40">
            {reports.map((report) => {
              const status = statusStyle(report.status);
              const StatusIcon = status.icon;

              return (
                <Link
                  key={report._id.toString()}
                  href={`/admin/reports/${report._id.toString()}`}
                  className="group grid gap-4 p-6 transition duration-200 hover:bg-slate-900/80 lg:grid-cols-[1fr_220px_160px_32px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate text-lg font-black text-white group-hover:text-rose-300 transition">
                        {report.artwork?.title || "Removed artwork"}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                      {report.actionTaken === "artwork_removed" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 text-xs font-black">
                          <Trash2 className="h-3.5 w-3.5" />
                          Removed
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-xs font-medium text-slate-300">
                      {report.reason}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Reported By</p>
                    <p className="truncate text-xs font-mono font-bold text-cyan-300 mt-0.5">
                      {report.reporter?.username || report.reporter?.email || "AOIE User"}
                    </p>
                  </div>

                  <div className="text-xs text-slate-400">
                    <p className="font-extrabold text-slate-300">Submitted</p>
                    <p className="font-mono mt-0.5">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-rose-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
