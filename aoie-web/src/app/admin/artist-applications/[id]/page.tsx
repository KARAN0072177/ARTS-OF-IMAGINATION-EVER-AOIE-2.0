import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import User from "@/models/User";
import ArtistApplicationReviewActions from "@/components/admin/ArtistApplicationReviewActions";

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
  createdAt: Date;
  user?: {
    username?: string | null;
    email?: string;
    role?: string;
  } | null;
};

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
      .lean()) as unknown as ApplicationDetail | null;

  if (!application) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <Link
        href="/admin/artist-applications"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to applications
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
          <BadgeCheck className="h-4 w-4" />
          Application detail
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              {application.displayName}
            </h1>
            <p className="mt-2 text-slate-600">
              {application.user?.username ||
                "Username pending"}{" "}
              · {application.user?.email || "No email"}
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-bold capitalize text-slate-700">
            {application.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold">
              Creator profile
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Current role
                </dt>
                <dd className="mt-2 font-semibold capitalize">
                  {application.user?.role || "user"}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Location
                </dt>
                <dd className="mt-2 font-semibold">
                  {application.location || "Not provided"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Bio
              </p>
              <p className="mt-2 leading-7 text-slate-700">
                {application.bio}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {application.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold">
              Links and samples
            </h2>
            <div className="mt-5 space-y-3">
              <a
                href={application.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
              >
                Portfolio
                <ExternalLink className="h-4 w-4" />
              </a>

              <div className="grid gap-4 sm:grid-cols-2">
                {application.sampleLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-cyan-200"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <Image
                        src={link}
                        alt="Sample artwork"
                        fill
                        sizes="(min-width: 1280px) 280px, 45vw"
                        className="object-cover transition group-hover:scale-[1.03]"
                        unoptimized
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 text-sm font-semibold text-slate-700">
                      Sample image
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>

        <ArtistApplicationReviewActions
          applicationId={application._id.toString()}
          disabled={application.status !== "pending"}
        />
      </div>
    </section>
  );
}
