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
  Sparkles,
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
    return "bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black shadow-lg shadow-rose-600/30";
  }

  if (role === "admin") {
    return "bg-purple-500/20 text-purple-300 font-black border border-purple-500/40";
  }

  if (role === "artist") {
    return "bg-cyan-500/20 text-cyan-300 font-black border border-cyan-500/40";
  }

  return "bg-slate-800 text-slate-300 font-bold border border-slate-700";
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
    <div className="group rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-xl transition duration-300 hover:border-cyan-500/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-black text-white">
            {value.toLocaleString()}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-400 border border-slate-800 shadow-inner group-hover:border-cyan-500/30">
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

  const avatar = user.artistProfile?.avatar || "";
  const banner = user.artistProfile?.banner || "";
  const displayName =
    user.artistProfile?.displayName ||
    user.username ||
    "AOIE user";

  return (
    <section className="space-y-6 text-slate-100">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-black text-slate-300 shadow-md transition hover:bg-slate-800 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users Directory
      </Link>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        <div className="relative h-44 bg-slate-900 sm:h-52">
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
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        </div>

        <div className="px-6 py-6 sm:px-10 sm:py-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-3xl font-black text-white shadow-xl sm:h-28 sm:w-28">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={`${displayName} avatar`}
                    fill
                    sizes="112px"
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
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {displayName}
                  </h1>
                  {user.isVerified && (
                    <BadgeCheck className="h-6 w-6 text-cyan-400" />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-slate-400 sm:text-base">
                  <span>@{user.username || "username-pending"}</span>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-slate-700 sm:block" />
                  <span className="break-all font-mono text-cyan-300">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 lg:justify-end">
              <span
                className={`rounded-full px-4 py-2 text-xs font-black capitalize ${roleClass(user.role)}`}
              >
                {user.role}
              </span>
              <span className="rounded-full bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-extrabold text-slate-300">
                {providerLabel(user.authProviders)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Artworks" value={artworkCount} icon={Brush} />
        <StatTile label="Likes" value={likeCount} icon={Heart} />
        <StatTile label="Saves" value={saveCount} icon={Bookmark} />
        <StatTile label="Comments" value={commentCount} icon={MessageCircle} />
        <StatTile label="Reports" value={reportCount} icon={Flag} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-5">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Account Metadata <Sparkles className="h-4 w-4 text-cyan-400" />
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <Mail className="h-4 w-4 text-cyan-400" /> Email
                </div>
                <p className="mt-3 break-words font-mono font-bold text-white text-sm">{user.email}</p>
                <p className={`mt-1 text-xs font-extrabold ${user.isVerified ? "text-emerald-400" : "text-amber-400"}`}>
                  {user.isVerified ? "Verified Email" : "Email Not Verified"}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <Shield className="h-4 w-4 text-purple-400" /> Authentication
                </div>
                <p className="mt-3 font-bold text-white text-sm">{providerLabel(user.authProviders)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {user.usernameSetupRequired ? "Username Setup Required" : "Username Configured"}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <CalendarDays className="h-4 w-4 text-emerald-400" /> Joined Platform
                </div>
                <p className="mt-3 font-mono font-bold text-white text-sm">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <UserRound className="h-4 w-4 text-cyan-400" /> Artist Status
                </div>
                <p className="mt-3 font-extrabold capitalize text-cyan-400 text-sm">{user.artistApplicationStatus}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-4">
            <h2 className="text-xl font-black tracking-tight text-white">Artist Profile Details</h2>
            <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Bio</p>
              <p className="mt-2 leading-relaxed text-slate-300 text-sm">
                {user.artistProfile?.bio || "No artist bio provided."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Location</p>
                <p className="mt-2 font-bold text-white text-sm">{user.artistProfile?.location || "Not provided"}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Website</p>
                <p className="mt-2 break-words font-mono font-bold text-cyan-400 text-sm">
                  {user.artistProfile?.website || "Not provided"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-4">
            <h2 className="text-xl font-black tracking-tight text-white">Artist Application History</h2>
            {applications.length === 0 ? (
              <p className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 text-xs font-bold text-slate-400">
                No artist applications submitted by this user.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/60 rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                {applications.map((application) => (
                  <Link
                    key={application._id.toString()}
                    href={`/admin/artist-applications/${application._id.toString()}`}
                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-900"
                  >
                    <div>
                      <p className="font-extrabold text-white">{application.displayName}</p>
                      <p className="text-xs font-bold capitalize text-cyan-400 mt-0.5">{application.status}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(application.createdAt).toLocaleDateString("en-US", {
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
