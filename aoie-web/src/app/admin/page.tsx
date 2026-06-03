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
    status: "Live",
    tone: "cyan",
  },
  {
    title: "Artwork reports",
    description:
      "Validate reports, remove violating artwork, and notify both sides.",
    icon: Flag,
    href: "/admin/reports",
    status: "Live",
    tone: "rose",
  },
  {
    title: "User management",
    description:
      "Search users, inspect roles, and handle account-level actions.",
    icon: Users,
    href: "/admin",
    status: "Planned",
    tone: "slate",
  },
  {
    title: "Platform activity",
    description:
      "Watch notification, comment, save, and collection activity trends.",
    icon: Bell,
    href: "/admin",
    status: "Planned",
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
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            {value.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {helper}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function userRoleClass(role: RecentUser["role"]) {
  if (role === "admin" || role === "super-admin") {
    return "bg-slate-950 text-white";
  }

  if (role === "artist") {
    return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
  }

  return "bg-slate-100 text-slate-600";
}

function moduleToneClass(tone: string) {
  if (tone === "rose") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (tone === "emerald") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (tone === "cyan") {
    return "bg-cyan-50 text-cyan-700 ring-cyan-100";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
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
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-white p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-700">
                <Shield className="h-4 w-4" />
                AOIE Admin
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Operations overview
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Review creator access, moderate artwork reports, and keep the
                gallery running from one focused workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <Link
                href="/admin/artist-applications"
                className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-700">
                    Pending artists
                  </span>
                  <BadgeCheck className="h-4 w-4 text-cyan-700" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">
                  {pendingApplications}
                </p>
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-700">
                    Pending reports
                  </span>
                  <Flag className="h-4 w-4 text-rose-600" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">
                  {pendingReports}
                </p>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-slate-100 p-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">
                Today focus
              </p>
              <p className="text-xs text-slate-500">
                Review pending queues first
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Send className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">
                Emails enabled
              </p>
              <p className="text-xs text-slate-500">
                Decisions notify users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <ImageIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">
                S3 cleanup
              </p>
              <p className="text-xs text-slate-500">
                Removed artwork deletes assets
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total users"
          value={totalUsers}
          helper="All registered accounts"
          icon={Users}
        />
        <StatCard
          label="Artists"
          value={totalArtists}
          helper="Approved creator accounts"
          icon={Brush}
        />
        <StatCard
          label="Artworks"
          value={totalArtworks}
          helper="Live artwork records"
          icon={ImageIcon}
        />
        <StatCard
          label="Comments"
          value={totalComments}
          helper="Conversation activity"
          icon={Bell}
        />
        <StatCard
          label="Collections"
          value={totalCollections}
          helper="User saved boards"
          icon={FolderHeart}
        />
        <StatCard
          label="Unread notifications"
          value={unreadNotifications}
          helper="Notification items unread"
          icon={BadgeCheck}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Admin modules
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Operational areas available in this workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {adminCards.map((card) => {
              const Icon = card.icon;
              const live = card.status === "Live";

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ring-1 ${moduleToneClass(card.tone)}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={
                        live
                          ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100"
                          : "rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200"
                      }
                    >
                      {card.status}
                    </span>
                  </div>
                  <h3 className="mt-4 font-extrabold text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Recent users
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Latest accounts joining AOIE.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUsers.map((user) => (
              <div
                key={user._id.toString()}
                className="flex items-center justify-between gap-3 p-4 transition hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-extrabold text-white">
                    {(user.username || user.email)
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">
                      {user.username || "Username pending"}
                    </p>
                    <p className="truncate text-sm text-slate-500">
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
                  <p className="mt-2 text-xs font-medium text-slate-500">
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
