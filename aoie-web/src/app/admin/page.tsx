import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Brush,
  FolderHeart,
  Image,
  Shield,
  Users,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
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
    status: "Next",
  },
  {
    title: "Artwork moderation",
    description:
      "Review reported or unpublished artwork from one focused queue.",
    icon: Image,
    status: "Planned",
  },
  {
    title: "User management",
    description:
      "Search users, inspect roles, and handle account-level actions.",
    icon: Users,
    status: "Planned",
  },
  {
    title: "Platform activity",
    description:
      "Watch notification, comment, save, and collection activity trends.",
    icon: Bell,
    status: "Planned",
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
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
    User.find()
      .select("username email role isVerified createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean() as unknown as Promise<RecentUser[]>,
  ]);

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
              <Shield className="h-4 w-4" />
              AOIE Admin
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">
              Control center
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              A clean foundation for platform operations, creator approvals,
              moderation, and account management.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800">
            Signed in as {session.user.role}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total users"
          value={totalUsers}
          icon={Users}
        />
        <StatCard
          label="Artists"
          value={totalArtists}
          icon={Brush}
        />
        <StatCard
          label="Artworks"
          value={totalArtworks}
          icon={Image}
        />
        <StatCard
          label="Comments"
          value={totalComments}
          icon={Bell}
        />
        <StatCard
          label="Collections"
          value={totalCollections}
          icon={FolderHeart}
        />
        <StatCard
          label="Unread notifications"
          value={unreadNotifications}
          icon={BadgeCheck}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold">
              Admin modules
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              These are the areas we can build next.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {adminCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      {card.status}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold">
              Recent users
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Latest accounts joining AOIE.
            </p>
          </div>

          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user._id.toString()}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    {user.username || "Username pending"}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {user.email}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-600 ring-1 ring-slate-200">
                    {user.role}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">
                    {user.isVerified
                      ? "Verified"
                      : "Unverified"}
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
