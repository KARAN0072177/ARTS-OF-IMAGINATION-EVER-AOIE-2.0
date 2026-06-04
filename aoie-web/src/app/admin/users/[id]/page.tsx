import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Brush,
  CalendarDays,
  Flag,
  Heart,
  Mail,
  MessageCircle,
  Shield,
  UserRound,
} from "lucide-react";
import { Types } from "mongoose";

import AdminUserControls from "@/components/admin/AdminUserControls";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import Artwork from "@/models/Artwork";
import ArtworkReport from "@/models/ArtworkReport";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import Save from "@/models/Save";
import User from "@/models/User";

type UserDetail = {
  _id: {
    toString(): string;
  };
  username?: string | null;
  email: string;
  role: "artist" | "user" | "admin" | "super-admin";
  isVerified: boolean;
  googleId?: string;
  authProviders?: string[];
  usernameSetupRequired: boolean;
  artistApplicationStatus:
    | "none"
    | "pending"
    | "approved"
    | "rejected";
  artistProfile?: {
    displayName?: string;
    bio?: string;
    website?: string;
    location?: string;
    avatar?: string;
    banner?: string;
    isArtistProfileComplete?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
};

type ApplicationItem = {
  _id: {
    toString(): string;
  };
  displayName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
};

function roleClass(role: UserDetail["role"]) {
  if (role === "super-admin") {
    return "bg-slate-950 text-white";
  }

  if (role === "admin") {
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  }

  if (role === "artist") {
    return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
  }

  return "bg-slate-100 text-slate-600";
}

function providerLabel(providers?: string[]) {
  const values = providers || [];

  if (
    values.includes("google") &&
    values.includes("credentials")
  ) {
    return "Email + Google";
  }

  if (values.includes("google")) {
    return "Google";
  }

  return "Email";
}

function StatTile({
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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold">
            {value.toLocaleString()}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();

  const user = (await User.findById(id)
    .select(
      "username email role isVerified googleId authProviders usernameSetupRequired artistApplicationStatus artistProfile createdAt updatedAt"
    )
    .lean()) as unknown as UserDetail | null;

  if (!user) {
    notFound();
  }

  const userId = user._id.toString();

  const [
    artworkCount,
    likeCount,
    saveCount,
    commentCount,
    reportCount,
    applications,
  ] = await Promise.all([
    Artwork.countDocuments({
      artist: userId,
    }),
    Like.countDocuments({
      user: userId,
    }),
    Save.countDocuments({
      user: userId,
    }),
    Comment.countDocuments({
      user: userId,
    }),
    ArtworkReport.countDocuments({
      reporter: userId,
    }),
    ArtistApplication.find({
      user: userId,
    })
      .select("displayName status createdAt")
      .sort({
        createdAt: -1,
      })
      .limit(4)
      .lean() as unknown as Promise<ApplicationItem[]>,
  ]);

  const avatar =
    user.artistProfile?.avatar || "";
  const banner =
    user.artistProfile?.banner || "";
  const displayName =
    user.artistProfile?.displayName ||
    user.username ||
    "AOIE user";

  return (
    <section className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative h-44 bg-slate-100 sm:h-52">
          {banner ? (
            <Image
              src={banner}
              alt={`${displayName} banner`}
              fill
              sizes="(min-width: 1280px) 1000px, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-cyan-50 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        </div>

        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-3xl font-extrabold text-white shadow-sm sm:h-28 sm:w-28">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={`${displayName} avatar`}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  (user.username || user.email)
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                    {displayName}
                  </h1>
                  {user.isVerified && (
                    <BadgeCheck className="h-5 w-5 text-cyan-600" />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-600 sm:text-base">
                  <span>
                    @{user.username || "username-pending"}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                  <span className="break-all">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span
                className={`rounded-full px-4 py-2 text-sm font-extrabold capitalize shadow-sm ${roleClass(user.role)}`}
              >
                {user.role}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-600 shadow-sm ring-1 ring-slate-200">
                {providerLabel(user.authProviders)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Artworks"
          value={artworkCount}
          icon={Brush}
        />
        <StatTile
          label="Likes"
          value={likeCount}
          icon={Heart}
        />
        <StatTile
          label="Saves"
          value={saveCount}
          icon={Bookmark}
        />
        <StatTile
          label="Comments"
          value={commentCount}
          icon={MessageCircle}
        />
        <StatTile
          label="Reports"
          value={reportCount}
          icon={Flag}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-extrabold tracking-tight">
              Account details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="mt-3 break-words font-bold">
                  {user.email}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {user.isVerified
                    ? "Verified email"
                    : "Email not verified"}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  <Shield className="h-4 w-4" />
                  Login
                </div>
                <p className="mt-3 font-bold">
                  {providerLabel(user.authProviders)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {user.usernameSetupRequired
                    ? "Username setup required"
                    : "Username ready"}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Joined
                </div>
                <p className="mt-3 font-bold">
                  {new Date(
                    user.createdAt
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Updated{" "}
                  {new Date(
                    user.updatedAt
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  <UserRound className="h-4 w-4" />
                  Artist status
                </div>
                <p className="mt-3 font-bold capitalize">
                  {user.artistApplicationStatus}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Profile{" "}
                  {user.artistProfile
                    ?.isArtistProfileComplete
                    ? "complete"
                    : "incomplete"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-extrabold tracking-tight">
              Artist profile
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Public creator details attached to this account.
            </p>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Bio
              </p>
              <p className="mt-2 leading-7 text-slate-700">
                {user.artistProfile?.bio ||
                  "No artist bio yet."}
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Location
                </p>
                <p className="mt-2 font-semibold">
                  {user.artistProfile?.location ||
                    "Not provided"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Website
                </p>
                <p className="mt-2 break-words font-semibold">
                  {user.artistProfile?.website ||
                    "Not provided"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-extrabold tracking-tight">
              Artist applications
            </h2>
            {applications.length === 0 ? (
              <p className="mt-4 rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                No artist applications submitted by this user.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 rounded-3xl border border-slate-200">
                {applications.map((application) => (
                  <Link
                    key={application._id.toString()}
                    href={`/admin/artist-applications/${application._id.toString()}`}
                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-bold">
                        {application.displayName}
                      </p>
                      <p className="text-sm capitalize text-slate-500">
                        {application.status}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-500">
                      {new Date(
                        application.createdAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="xl:sticky xl:top-8 xl:self-start">
          <AdminUserControls
            userId={userId}
            currentAdminId={session?.user?.id || ""}
            currentAdminRole={session?.user?.role || ""}
            initialRole={user.role}
            initialIsVerified={user.isVerified}
          />
        </div>
      </div>
    </section>
  );
}
