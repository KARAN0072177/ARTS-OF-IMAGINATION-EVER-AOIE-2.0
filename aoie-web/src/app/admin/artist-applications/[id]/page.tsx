import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import { Types } from "mongoose";

import ArtistApplicationReviewActions from "@/components/admin/ArtistApplicationReviewActions";
import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import User from "@/models/User";

void User;

type ApplicationDetail = {
  _id: {
    toString(): string;
  };
  displayName: string;
  bio: string;
  location: string;
  website: string;
  categories: string[];
  sampleLinks: string[];
  ownershipConfirmed: boolean;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  reviewedBy?: {
    username?: string | null;
    email?: string;
  } | null;
  reviewedAt?: Date;
  aiEnhanced?: boolean;
  aiModel?: string;
  promptVersion?: string;
  createdAt: Date;
  user?: {
    username?: string | null;
    email?: string;
    role?: string;
  } | null;
};

function statusStyle(status: ApplicationDetail["status"]) {
  if (status === "approved") {
    return {
      label: "Approved",
      className:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black",
      icon: CheckCircle2,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      className: "bg-rose-500/15 text-rose-300 border border-rose-500/30 font-black",
      icon: XCircle,
    };
  }

  return {
    label: "Pending review",
    className: "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-black animate-pulse",
    icon: BadgeCheck,
  };
}

export default async function ArtistApplicationDetailPage({
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

  const application =
    (await ArtistApplication.findById(id)
      .populate("user", "username email role")
      .populate("reviewedBy", "username email")
      .lean()) as unknown as ApplicationDetail | null;

  if (!application) {
    notFound();
  }

  const status = statusStyle(application.status);
  const StatusIcon = status.icon;

  return (
    <section className="space-y-6 text-slate-100">
      <Link
        href="/admin/artist-applications"
        className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-black text-slate-300 shadow-md transition hover:bg-slate-800 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications Queue
      </Link>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        {/* Dark Glass Hero Banner Header */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-inner">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                Creator Access Case
              </p>
              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                {application.displayName} <Sparkles className="h-6 w-6 text-cyan-400" />
              </h1>
              <p className="mt-2.5 font-mono text-xs text-cyan-300">
                {application.user?.username || "Username pending"} / {application.user?.email || "No email"}
              </p>
            </div>
            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${status.className}`}
            >
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </span>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-slate-800/80 p-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 bg-slate-950/40">
          <div className="flex items-center gap-3.5 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 shadow-inner">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-white">Current Role</p>
              <p className="text-xs font-bold text-slate-400 capitalize">
                {application.user?.role || "user"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-white">Location</p>
              <p className="text-xs font-bold text-slate-400">
                {application.location || "Not specified"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-white">Ownership</p>
              <p className="text-xs font-bold text-slate-400">
                {application.ownershipConfirmed
                  ? "Confirmed by applicant"
                  : "Not confirmed"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Creator Profile Details <Sparkles className="h-4 w-4 text-cyan-400" />
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Public details requested by the user for their creator profile.
                </p>
              </div>
              {application.website && (
                <a
                  href={application.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/50 px-4 py-2 text-xs font-extrabold text-cyan-300 transition hover:bg-cyan-900/60"
                >
                  <Globe className="h-4 w-4" />
                  Portfolio Website
                </a>
              )}
            </div>

            <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Applicant Bio
              </p>
              <p className="mt-2.5 leading-relaxed text-slate-300 text-sm font-medium">
                {application.bio}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {application.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-slate-950 border border-slate-800 px-3.5 py-1 text-xs font-bold text-slate-300"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Submitted Sample Artworks</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Uploaded samples submitted for operational review.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {application.sampleLinks.map((link, index) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 transition duration-300 hover:border-cyan-500/50 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] bg-slate-900">
                    <Image
                      src={link}
                      alt={`Sample artwork ${index + 1}`}
                      fill
                      sizes="(min-width: 1280px) 360px, 50vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4 text-xs font-extrabold text-white border-t border-slate-800">
                    Sample {index + 1}
                    <ExternalLink className="h-4 w-4 shrink-0 text-cyan-400" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="xl:sticky xl:top-8 xl:self-start">
          <ArtistApplicationReviewActions
            applicationId={application._id.toString()}
            disabled={application.status !== "pending"}
            status={application.status}
            adminNote={application.adminNote}
            reviewedBy={application.reviewedBy?.username || application.reviewedBy?.email || null}
            reviewedAt={application.reviewedAt ? new Date(application.reviewedAt).toISOString() : null}
            aiEnhanced={application.aiEnhanced}
            aiModel={application.aiModel}
            promptVersion={application.promptVersion}
          />
        </div>
      </div>
    </section>
  );
}
