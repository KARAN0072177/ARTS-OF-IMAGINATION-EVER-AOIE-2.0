import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Flag,
} from "lucide-react";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import ArtworkReport from "@/models/ArtworkReport";
import User from "@/models/User";
import ArtworkReportReviewActions from "@/components/admin/ArtworkReportReviewActions";

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

  return (
    <section className="space-y-6">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reports
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-rose-600">
          <Flag className="h-4 w-4" />
          Report detail
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              {report.artwork?.title || "Removed artwork"}
            </h1>
            <p className="mt-2 text-slate-600">
              {report.reason}
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-bold capitalize text-slate-700">
            {report.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {report.artwork?.imageUrl ? (
              <div className="relative aspect-video bg-slate-100">
                <Image
                  src={report.artwork.imageUrl}
                  alt={report.artwork.title || "Reported artwork"}
                  fill
                  sizes="(min-width: 1280px) 760px, 100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500">
                Artwork is no longer available.
              </div>
            )}

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Reporter
                </p>
                <p className="mt-2 font-semibold">
                  {report.reporter?.username ||
                    "AOIE user"}
                </p>
                <p className="text-sm text-slate-500">
                  {report.reporter?.email}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Artist
                </p>
                <p className="mt-2 font-semibold">
                  {report.artist?.username ||
                    "AOIE artist"}
                </p>
                <p className="text-sm text-slate-500">
                  {report.artist?.email}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 p-5">
              <h2 className="font-bold">Report details</h2>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                {report.details || "No extra details provided."}
              </p>

              {report.artwork?._id && (
                <Link
                  href={`/artwork/${report.artwork._id.toString()}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                >
                  Open public artwork
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
          </section>
        </div>

        <ArtworkReportReviewActions
          reportId={report._id.toString()}
          disabled={report.status !== "pending"}
        />
      </div>
    </section>
  );
}
