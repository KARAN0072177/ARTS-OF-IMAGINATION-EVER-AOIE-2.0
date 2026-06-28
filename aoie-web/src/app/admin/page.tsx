import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Brush,
  Clock,
  Flag,
  FolderHeart,
  Image as ImageIcon,
  Send,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import ArtworkReport from "@/models/ArtworkReport";
import ArtistApplication from "@/models/ArtistApplication";
import Collection from "@/models/Collection";
import Comment from "@/models/Comment";
import Notification from "@/models/Notification";
import User from "@/models/User";

type RecentUser = {
  _id: {
    toString(): string;
  };
  username?: string | null;
  email: string;
  role: "artist" | "user" | "admin" | "super-admin";
  isVerified: boolean;
  createdAt: Date;
};

const adminCards = [
  {
    title: "Artist approvals",
    description:
      "Review future creator applications before granting upload access.",
    icon: BadgeCheck,
    href: "/admin/artist-applications",
    status: "Live Queue",
    tone: "cyan",
  },
  {
    title: "Artwork reports",
    description:
      "Validate reports, remove violating artwork, and notify both sides.",
    icon: Flag,
    href: "/admin/reports",
    status: "Live Queue",
    tone: "rose",
  },
  {
    title: "User management",
    description:
      "Search users, inspect roles, handle strikes, and enforce overrides.",
    icon: Users,
    href: "/admin/users",
    status: "Live SOC",
    tone: "cyan",
  },
  {
    title: "Platform activity",
    description:
      "Watch security threat vectors, brute-force logs, and telemetry stream.",
    icon: Bell,
    href: "/admin/activity",
    status: "Live SOC",
    tone: "emerald",
  },
];

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="group rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">
            {value.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-400">
            {helper}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-400 border border-slate-800 shadow-inner group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 transition">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function userRoleClass(role: RecentUser["role"]) {
  if (role === "admin" || role === "super-admin") {
    return "bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black shadow-sm";
  }

  if (role === "artist") {
    return "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold";
  }

  return "bg-slate-800/80 text-slate-400 border border-slate-700/80 font-bold";
}

function moduleToneClass(tone: string) {
  if (tone === "rose") {
    return "bg-rose-950/80 text-rose-400 border border-rose-500/30";
  }

  if (tone === "emerald") {
    return "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30";
  }

  if (tone === "cyan") {
    return "bg-cyan-950/80 text-cyan-400 border border-cyan-500/30";
  }

  return "bg-slate-900 text-slate-300 border border-slate-800";
}

export default async function AdminPage() {
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

  const [
    totalUsers,
    totalArtists,
    totalArtworks,
    totalComments,
    totalCollections,
    unreadNotifications,
    pendingApplications,
    pendingReports,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({
      role: "artist",
    }),
    Artwork.countDocuments(),
    Comment.countDocuments(),
    Collection.countDocuments(),
    Notification.countDocuments({
      isRead: false,
    }),
    ArtistApplication.countDocuments({
      status: "pending",
    }),
    ArtworkReport.countDocuments({
      status: "pending",
    }),
    User.find()
      .select("username email role isVerified createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean() as unknown as Promise<RecentUser[]>,
  ]);

  return (
    <section className="space-y-8 text-slate-100">
      {/* Dark Glass Hero Banner */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-inner">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                AOIE Operations Radar
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl text-white">
                Operations Overview
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-300">
                Review creator access, moderate artwork reports, and keep the gallery running from one unified zero-trust workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[440px]">
              <Link
                href="/admin/artist-applications"
                className="group rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-cyan-500/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-cyan-300 transition">
                    Pending Artists
                  </span>
                  <BadgeCheck className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="mt-2 text-3xl font-black text-white">
                  {pendingApplications}
                </p>
              </Link>
              <Link
                href="/admin/reports"
                className="group rounded-3xl border border-rose-500/30 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-rose-400 hover:shadow-rose-500/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-rose-300 transition">
                    Pending Reports
                  </span>
                  <Flag className="h-5 w-5 text-rose-400" />
                </div>
                <p className="mt-2 text-3xl font-black text-white">
                  {pendingReports}
                </p>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-slate-800/80 p-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 bg-slate-950/40">
          <div className="flex items-center gap-3.5 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-white">Today Focus</p>
              <p className="text-xs font-bold text-slate-400">Review pending queues first</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-white">Emails Enabled</p>
              <p className="text-xs font-bold text-slate-400">Decisions notify users via Resend</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-inner">
              <ImageIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-white">S3 Auto Cleanup</p>
              <p className="text-xs font-bold text-slate-400">Purged artworks purge AWS S3 assets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Users"
          value={totalUsers}
          helper="All registered accounts"
          icon={Users}
        />
        <StatCard
          label="Approved Artists"
          value={totalArtists}
          helper="Verified creator accounts"
          icon={Brush}
        />
        <StatCard
          label="Live Artworks"
          value={totalArtworks}
          helper="Active artwork records"
          icon={ImageIcon}
        />
        <StatCard
          label="Total Comments"
          value={totalComments}
          helper="Community conversation activity"
          icon={Bell}
        />
        <StatCard
          label="User Collections"
          value={totalCollections}
          helper="Saved curation boards"
          icon={FolderHeart}
        />
        <StatCard
          label="Unread Notifications"
          value={unreadNotifications}
          helper="Notification items unread"
          icon={BadgeCheck}
        />
      </div>

      {/* Admin Modules & Recent Users */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Admin Control Modules <Sparkles className="h-5 w-5 text-cyan-400" />
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Operational domains available in this workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {adminCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:bg-slate-900/80 hover:shadow-xl shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner ${moduleToneClass(card.tone)}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
                      {card.status}
                    </span>
                  </div>
                  <h3 className="mt-4 font-black text-white text-base group-hover:text-cyan-300 transition">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-400">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-xl overflow-hidden">
          <div className="border-b border-slate-800/80 p-6">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Recent Users Directory
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Latest accounts joining AOIE 2.0.
            </p>
          </div>

          <div className="divide-y divide-slate-800/60">
            {recentUsers.map((user) => (
              <div
                key={user._id.toString()}
                className="flex items-center justify-between gap-3 p-4.5 transition duration-200 hover:bg-slate-800/50"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-sm font-black text-white shadow-md">
                    {(user.username || user.email)
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-white">
                      {user.username || "Username pending"}
                    </p>
                    <p className="truncate text-xs font-mono text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${userRoleClass(user.role)}`}
                  >
                    {user.role}
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    {user.isVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
