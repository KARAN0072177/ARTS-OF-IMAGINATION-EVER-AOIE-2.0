import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react";

import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import User from "@/models/User";

void User;

type ApplicationItem = {
  _id: {
    toString(): string;
  };
  displayName: string;
  location?: string;
  categories: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  user?: {
    username?: string | null;
    email?: string;
  } | null;
};

function statusStyle(status: ApplicationItem["status"]) {
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
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    icon: Clock,
  };
}

export default async function ArtistApplicationsPage() {
  await connectDB();

  const applications =
    (await ArtistApplication.find()
      .populate("user", "username email")
      .sort({
        status: 1,
        createdAt: -1,
      })
      .lean()) as unknown as ApplicationItem[];

  const pendingCount = applications.filter(
    (application) =>
      application.status === "pending"
  ).length;
  const approvedCount = applications.filter(
    (application) =>
      application.status === "approved"
  ).length;
  const rejectedCount = applications.filter(
    (application) =>
      application.status === "rejected"
  ).length;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-white p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-700">
            <BadgeCheck className="h-4 w-4" />
            Creator access
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                Artist applications
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Review creator requests, inspect sample artwork, and grant
                upload access only when the account is ready.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[420px]">
              <div className="rounded-2xl border border-amber-200 bg-white p-3">
                <p className="text-xs font-bold text-amber-700">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-3">
                <p className="text-xs font-bold text-emerald-700">
                  Approved
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {approvedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-white p-3">
                <p className="text-xs font-bold text-rose-700">
                  Rejected
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-700">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold">
              No applications yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Creator requests will appear here once users apply.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((application) => {
              const status = statusStyle(application.status);
              const StatusIcon = status.icon;

              return (
                <Link
                  key={application._id.toString()}
                  href={`/admin/artist-applications/${application._id.toString()}`}
                  className="group grid gap-4 p-5 transition hover:bg-slate-50 lg:grid-cols-[1fr_220px_160px_32px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-extrabold text-slate-950">
                        {application.displayName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {application.user?.username ||
                        "Username pending"}{" "}
                      / {application.user?.email || "No email"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {application.categories
                        .slice(0, 4)
                        .map((category) => (
                          <span
                            key={category}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                          >
                            {category}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">
                      {application.location || "No location"}
                    </span>
                  </div>

                  <div className="text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">
                      Submitted
                    </p>
                    <p>
                      {new Date(
                        application.createdAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-700" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
