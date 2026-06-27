import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Brush,
  LogOut,
  Shield,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import ArtworkReport from "@/models/ArtworkReport";
import AdminNavLinks from "@/components/admin/AdminNavLinks";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  const isAdmin =
    session.user.role === "admin" ||
    session.user.role === "super-admin";

  if (!isAdmin) {
    redirect("/feed");
  }

  await connectDB();
  const [pendingCount, pendingReportsCount] = await Promise.all([
    ArtistApplication.countDocuments({
      status: "pending",
    }),
    ArtworkReport.countDocuments({
      status: "pending",
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-slate-200/80 bg-white px-5 py-6 shadow-[10px_0_35px_rgba(15,23,42,0.04)] lg:block">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-extrabold tracking-tight">
              AOIE Admin
            </span>
            <span className="block text-xs font-medium text-slate-500">
              Operations workspace
            </span>
          </span>
        </Link>

        <AdminNavLinks
          initialPendingCount={pendingCount}
          initialPendingReportsCount={pendingReportsCount}
        />

        <div className="absolute inset-x-5 bottom-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
              <Brush className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {session.user.role}
              </p>
              <p className="text-xs text-cyan-800/70">
                Admin session active
              </p>
            </div>
          </div>
          <Link
            href="/feed"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-cyan-800 shadow-sm transition hover:bg-cyan-950 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Back to site
          </Link>
        </div>
      </aside>

      <div className="lg:pl-80">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">AOIE Admin</p>
              <p className="text-xs text-slate-500">
                {session.user.role}
              </p>
            </div>
          </div>
          <AdminNavLinks
            initialPendingCount={pendingCount}
            initialPendingReportsCount={pendingReportsCount}
            mobile
          />
        </header>

        <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
