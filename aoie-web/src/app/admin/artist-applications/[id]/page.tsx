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
        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      icon: CheckCircle2,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      icon: XCircle,
    };
  }

  return {
    label: "Pending review",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
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
    <section className="space-y-6">
      <Link
        href="/admin/artist-applications"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to applications
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-700">
                <ShieldCheck className="h-4 w-4" />
                Application detail
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
                {application.displayName}
              </h1>
              <p className="mt-2 text-slate-600">
                {application.user?.username ||
                  "Username pending"}{" "}
                / {application.user?.email || "No email"}
              </p>
            </div>
            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${status.className}`}
            >
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </span>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-slate-100 p-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <UserRound className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Current role</p>
              <p className="text-xs capitalize text-slate-500">
                {application.user?.role || "user"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Location</p>
              <p className="text-xs text-slate-500">
                {application.location || "Not provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Ownership</p>
              <p className="text-xs text-slate-500">
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
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Creator profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Public details the user wants attached to their artist
                  account.
                </p>
              </div>
              {application.website && (
                <a
                  href={application.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                >
                  <Globe className="h-4 w-4" />
                  Portfolio
                </a>
              )}
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                Bio
              </p>
              <p className="mt-3 leading-7 text-slate-700">
                {application.bio}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {application.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-700 ring-1 ring-cyan-100"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-extrabold tracking-tight">
                Sample artwork
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Uploaded samples submitted for admin review.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {application.sampleLinks.map((link, index) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={link}
                      alt={`Sample artwork ${index + 1}`}
                      fill
                      sizes="(min-width: 1280px) 360px, 50vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4 text-sm font-bold text-slate-700">
                    Sample {index + 1}
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
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
