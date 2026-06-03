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
        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      icon: CheckCircle2,
    };
  }

  if (status === "invalid") {
    return {
      label: "Invalid report",
      className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      icon: XCircle,
    };
  }

  return {
    label: "Pending review",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
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
    <section className="space-y-6">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-rose-200 hover:text-rose-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reports
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-rose-50 to-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-rose-600">
                <Flag className="h-4 w-4" />
                Moderation case
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
                {report.artwork?.title || "Removed artwork"}
              </h1>
              <p className="mt-2 text-slate-600">
                {report.reason}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${status.className}`}
              >
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
              {report.actionTaken === "artwork_removed" && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-extrabold text-rose-700 ring-1 ring-rose-100">
                  <Trash2 className="h-4 w-4" />
                  Artwork removed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            {report.artwork?.imageUrl ? (
              <div className="relative aspect-[16/10] bg-slate-100">
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
              <div className="flex min-h-[340px] flex-col items-center justify-center bg-slate-50 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
                  <ImageOff className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-extrabold">
                  Artwork unavailable
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  This artwork has already been removed or is no longer
                  available.
                </p>
              </div>
            )}

            <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  <UserRound className="h-4 w-4" />
                  Reporter
                </div>
                <p className="mt-3 font-extrabold">
                  {report.reporter?.username || "AOIE user"}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {report.reporter?.email}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  <Palette className="h-4 w-4" />
                  Artist
                </div>
                <p className="mt-3 font-extrabold">
                  {report.artist?.username || "AOIE artist"}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {report.artist?.email}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Category
                </div>
                <p className="mt-3 font-extrabold">
                  {report.artwork?.category || "Unknown"}
                </p>
                <p className="text-sm text-slate-500">
                  Reported content
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Report details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  User-submitted context for the moderation decision.
                </p>
              </div>

              {report.artwork?._id && (
                <Link
                  href={`/artwork/${report.artwork._id.toString()}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                >
                  Open public artwork
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                Reason
              </p>
              <p className="mt-3 font-bold text-slate-900">
                {report.reason}
              </p>
            </div>

            <div className="mt-4 rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                Extra details
              </p>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                {report.details || "No extra details provided."}
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
