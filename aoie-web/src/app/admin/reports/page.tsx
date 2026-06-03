import Link from "next/link";
import {
  ArrowRight,
  Flag,
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

export default async function AdminReportsPage() {
  await connectDB();

  const reports = (await ArtworkReport.find()
    .populate("artwork", "title")
    .populate("reporter", "username email")
    .sort({
      status: 1,
      createdAt: -1,
    })
    .lean()) as unknown as ReportItem[];

  const pendingCount = reports.filter(
    (report) => report.status === "pending"
  ).length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-rose-600">
          <Flag className="h-4 w-4" />
          Moderation
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          Artwork reports
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Review reported artwork, mark reports valid or invalid, and remove
          violating artwork when needed.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-bold">
              Report queue
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {pendingCount} pending report
              {pendingCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No artwork reports yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <Link
                key={report._id.toString()}
                href={`/admin/reports/${report._id.toString()}`}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">
                      {report.artwork?.title ||
                        "Removed artwork"}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
                      {report.status}
                    </span>
                    {report.actionTaken ===
                      "artwork_removed" && (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                        removed
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {report.reason} · reported by{" "}
                    {report.reporter?.username ||
                      report.reporter?.email ||
                      "AOIE user"}
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
