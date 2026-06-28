import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
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
    label: "Pending",
    className: "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-black",
    icon: Clock,
  };
}

export default async function ArtistApplicationsPage() {
  await connectDB();

  const rawApplications =
    (await ArtistApplication.find()
      .populate("user", "username email")
      .sort({
        createdAt: -1,
      })
      .lean()) as unknown as ApplicationItem[];

  const applications = [...rawApplications].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = applications.filter(
    (application) => application.status === "pending"
  ).length;
  const approvedCount = applications.filter(
    (application) => application.status === "approved"
  ).length;
  const rejectedCount = applications.filter(
    (application) => application.status === "rejected"
  ).length;

  return (
    <section className="space-y-6 text-slate-100">
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        {/* Dark Glass Hero Banner */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-inner">
                <BadgeCheck className="h-3.5 w-3.5 text-cyan-400" />
                Creator Access Radar
              </p>
              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                Artist Applications <Sparkles className="h-6 w-6 text-cyan-400" />
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                Review creator requests, inspect sample artwork, and grant upload access only when the account is verified and ready.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:w-[440px]">
              <div className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-amber-400 tracking-wider">Pending</p>
                <p className="mt-1 text-3xl font-black text-white">{pendingCount}</p>
              </div>
              <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-emerald-400 tracking-wider">Approved</p>
                <p className="mt-1 text-3xl font-black text-white">{approvedCount}</p>
              </div>
              <div className="rounded-3xl border border-rose-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-rose-400 tracking-wider">Rejected</p>
                <p className="mt-1 text-3xl font-black text-white">{rejectedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="p-16 text-center bg-slate-950/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 text-cyan-400">
              <BadgeCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black text-white">No applications yet</h2>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Creator requests will appear here once users apply.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 bg-slate-950/40">
            {applications.map((application) => {
              const status = statusStyle(application.status);
              const StatusIcon = status.icon;

              return (
                <Link
                  key={application._id.toString()}
                  href={`/admin/artist-applications/${application._id.toString()}`}
                  className="group grid gap-4 p-6 transition duration-200 hover:bg-slate-900/80 lg:grid-cols-[1fr_220px_160px_32px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate text-lg font-black text-white group-hover:text-cyan-300 transition">
                        {application.displayName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-xs font-mono text-slate-400">
                      {application.user?.username || "Username pending"} / {application.user?.email || "No email"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {application.categories.slice(0, 4).map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-bold text-slate-300"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="truncate">{application.location || "No location specified"}</span>
                  </div>

                  <div className="text-xs text-slate-400">
                    <p className="font-extrabold text-slate-300">Submitted</p>
                    <p className="font-mono mt-0.5">
                      {new Date(application.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
