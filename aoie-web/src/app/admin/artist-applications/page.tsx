import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
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
  categories: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  user?: {
    username?: string | null;
    email?: string;
  } | null;
};

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

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
          <BadgeCheck className="h-4 w-4" />
          Admin review
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          Artist applications
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Review users who want upload access and approve only trusted creator
          accounts.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-bold">
              Review queue
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {pendingCount} pending application
              {pendingCount === 1 ? "" : "s"}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <Clock className="h-5 w-5" />
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No artist applications yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((application) => (
              <Link
                key={application._id.toString()}
                href={`/admin/artist-applications/${application._id.toString()}`}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">
                      {application.displayName}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
                      {application.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {application.user?.username ||
                      "Username pending"}{" "}
                    · {application.user?.email || "No email"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {application.categories.join(", ")}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
