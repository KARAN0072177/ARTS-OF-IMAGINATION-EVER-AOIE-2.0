import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Flag,
  ImageOff,
  Palette,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { Types } from "mongoose";

import ArtworkReportReviewActions from "@/components/admin/ArtworkReportReviewActions";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import ArtworkReport from "@/models/ArtworkReport";
import User from "@/models/User";

void Artwork;
void User;

type ReportDetail = {
  _id: {
    toString(): string;
  };
  reason: string;
  details: string;
  status: "pending" | "valid" | "invalid";
  adminNote?: string;
  actionTaken: "none" | "artwork_removed";
  createdAt: Date;
  artwork?: {
    _id: {
      toString(): string;
    };
    title?: string;
    imageUrl?: string;
    category?: string;
  } | null;
  reporter?: {
    username?: string | null;
    email?: string;
  } | null;
  artist?: {
    username?: string | null;
    email?: string;
  } | null;
};

function statusStyle(status: ReportDetail["status"]) {
  if (status === "valid") {
    return {
      label: "Valid report",
      className:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black",
      icon: CheckCircle2,
    };
  }

  if (status === "invalid") {
    return {
      label: "Invalid report",
      className: "bg-slate-800 text-slate-400 border border-slate-700 font-bold",
      icon: XCircle,
    };
  }

  return {
    label: "Pending review",
    className: "bg-rose-500/15 text-rose-300 border border-rose-500/30 font-black animate-pulse",
    icon: ShieldAlert,
  };
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();

  const report = (await ArtworkReport.findById(id)
    .populate("artwork", "title imageUrl category")
    .populate("reporter", "username email")
    .populate("artist", "username email")
    .lean()) as unknown as ReportDetail | null;

  if (!report) {
    notFound();
  }

  const status = statusStyle(report.status);
  const StatusIcon = status.icon;

  return (
    <section className="space-y-6 text-slate-100">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-black text-slate-300 shadow-md transition hover:bg-slate-800 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reports Queue
      </Link>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        {/* Dark Glass Hero Banner */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-rose-400 border border-rose-500/30 backdrop-blur-md shadow-inner">
                <Flag className="h-3.5 w-3.5 text-rose-400" />
                Moderation Case Investigation
              </p>
              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                {report.artwork?.title || "Removed artwork"} <Sparkles className="h-6 w-6 text-rose-400" />
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                {report.reason}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${status.className}`}
              >
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
              {report.actionTaken === "artwork_removed" && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 px-4 py-2 text-xs font-black">
                  <Trash2 className="h-4 w-4" />
                  Artwork Removed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-xl">
            {report.artwork?.imageUrl ? (
              <div className="relative aspect-[16/10] bg-slate-950">
                <Image
                  src={report.artwork.imageUrl}
                  alt={report.artwork.title || "Reported artwork"}
                  fill
                  sizes="(min-width: 1280px) 820px, 100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex min-h-[340px] flex-col items-center justify-center bg-slate-950/80 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-slate-500 border border-slate-800 shadow-inner">
                  <ImageOff className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-black text-white">
                  Artwork Unavailable
                </h2>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  This artwork has already been removed or is no longer available in DB.
                </p>
              </div>
            )}

            <div className="grid gap-4 border-t border-slate-800/80 p-6 sm:grid-cols-3 bg-slate-950/40">
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <UserRound className="h-4 w-4 text-cyan-400" /> Reporter
                </div>
                <p className="mt-3 font-extrabold text-white text-sm">
                  {report.reporter?.username || "AOIE User"}
                </p>
                <p className="truncate text-xs font-mono text-cyan-300 mt-1">
                  {report.reporter?.email}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <Palette className="h-4 w-4 text-purple-400" /> Creator / Artist
                </div>
                <p className="mt-3 font-extrabold text-white text-sm">
                  {report.artist?.username || "AOIE Artist"}
                </p>
                <p className="truncate text-xs font-mono text-purple-300 mt-1">
                  {report.artist?.email}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Category
                </div>
                <p className="mt-3 font-extrabold text-white text-sm">
                  {report.artwork?.category || "Unknown"}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Reported Content Category
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Report Investigation Context <Sparkles className="h-4 w-4 text-rose-400" />
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  User-submitted context and justification for the moderation decision.
                </p>
              </div>

              {report.artwork?._id && (
                <Link
                  href={`/artwork/${report.artwork._id.toString()}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-950/50 px-4 py-2 text-xs font-extrabold text-rose-300 transition hover:bg-rose-900/60"
                >
                  Open Public Artwork
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Primary Flagged Reason
              </p>
              <p className="mt-2.5 font-black text-rose-400 text-base">
                {report.reason}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Detailed User Context
              </p>
              <p className="mt-2.5 whitespace-pre-wrap leading-relaxed text-slate-300 text-sm font-medium">
                {report.details || "No extra details provided by reporter."}
              </p>
            </div>
          </section>
        </div>

        <div className="xl:sticky xl:top-8 xl:self-start">
          <ArtworkReportReviewActions
            reportId={report._id.toString()}
            disabled={report.status !== "pending"}
          />
        </div>
      </div>
    </section>
  );
}
