import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  ExternalLink,
  Heart,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Follow from "@/models/Follow";
import Like from "@/models/Like";
import Save from "@/models/Save";
import User from "@/models/User";
import LogoutButton from "@/components/auth/LogoutButton";
import ArtistProfileForm from "@/components/profile/ArtistProfileForm";
import BecomeArtistButton from "@/components/profile/BecomeArtistButton";
import FollowStats from "@/components/profile/FollowStats";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

interface ArtistProfileData {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar?: string;
  banner?: string;
  isArtistProfileComplete?: boolean;
}

export default async function ProfilePage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select(
      "username email role isVerified authProviders usernameSetupRequired artistApplicationStatus artistProfile createdAt updatedAt"
    )
    .lean();

  if (!user) {
    redirect("/login");
  }

  if (
    !user.username &&
    user.usernameSetupRequired
  ) {
    redirect("/complete-profile");
  }

  const username =
    user.username || "AOIE User";
  const artistProfile =
    (user.artistProfile ||
      {}) as ArtistProfileData;
  const publicDisplayName =
    artistProfile.displayName ||
    username;
  const loginProvider =
    session.user.loginProvider === "google"
      ? "google"
      : "email";
  const loginProviderLabel =
    loginProvider === "google"
      ? "Google"
      : "Email";
  const connectedProviders =
    user.authProviders?.length > 0
      ? user.authProviders
      : ["credentials"];

  const details = [
    ["Username", username],
    ["Email", user.email],
    ["Role", user.role],
    [
      "Email status",
      user.isVerified
        ? "Verified"
        : "Not verified",
    ],
    ["Joined", formatDate(user.createdAt)],
    [
      "Last updated",
      formatDate(user.updatedAt),
    ],
  ];

  const [
    followersCount,
    followingCount,
    likedImagesCount,
    savedImagesCount,
  ] = await Promise.all([
    Follow.countDocuments({
      following: user._id,
    }),
    Follow.countDocuments({
      follower: user._id,
    }),
    Like.countDocuments({
      user: user._id,
    }),
    Save.countDocuments({
      user: user._id,
    }),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Profile
          </h1>
        </div>

        {user.role === "artist" &&
          user.username && (
            <Link
              href={`/artist/${user.username}`}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              View public page
              <ExternalLink size={15} />
            </Link>
          )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-52 bg-slate-200">
          {artistProfile.banner ? (
            <img
              src={artistProfile.banner}
              alt="Artist banner"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
              {user.role === "artist"
                ? "Add a banner from your artist profile editor"
                : "AOIE account workspace"}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative px-6 pb-6 sm:px-8">
          <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-950 text-4xl font-semibold text-white shadow-sm">
                {artistProfile.avatar ? (
                  <img
                    src={artistProfile.avatar}
                    alt={publicDisplayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  publicDisplayName
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {publicDisplayName}
                  </h2>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold capitalize text-cyan-700">
                    {user.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  @{username}
                </p>
                {artistProfile.bio && (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    {artistProfile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:pb-2">
              <FollowStats
                userId={user._id.toString()}
                followersCount={followersCount}
                followingCount={followingCount}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Account status
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Login and verification
                  details.
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <ShieldCheck size={18} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">
                  Email
                </span>
                <span className="text-sm font-semibold text-slate-950">
                  {user.isVerified
                    ? "Verified"
                    : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">
                  Role
                </span>
                <span className="text-sm font-semibold capitalize text-slate-950">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Current login
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 shadow-sm ring-1 ring-slate-200">
                {loginProvider ===
                "google" ? (
                  <FcGoogle size={23} />
                ) : (
                  <Mail
                    size={19}
                    className="text-slate-700"
                  />
                )}
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {loginProviderLabel}
                </p>
                <p className="text-xs text-slate-500">
                  Used for this session
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {connectedProviders.map(
                (provider) => {
                  const isGoogle =
                    provider === "google";
                  const label = isGoogle
                    ? "Google linked"
                    : "Email linked";

                  return (
                    <span
                      key={provider}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                    >
                      {isGoogle ? (
                        <FcGoogle size={14} />
                      ) : (
                        <Mail
                          size={13}
                          className="text-slate-500"
                        />
                      )}
                      {label}
                    </span>
                  );
                }
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/liked"
              className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Heart
                  size={18}
                  className="fill-rose-500"
                />
              </span>
              <span className="mt-3 block text-sm font-semibold text-slate-950">
                Liked
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {likedImagesCount} images
              </span>
            </Link>

            <Link
              href="/saved"
              className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                <Bookmark
                  size={18}
                  className="fill-cyan-600"
                />
              </span>
              <span className="mt-3 block text-sm font-semibold text-slate-950">
                Saved
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {savedImagesCount} images
              </span>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {user.role === "user" ? (
              <BecomeArtistButton
                status={
                  user.artistApplicationStatus ||
                  "none"
                }
              />
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Artist account active
              </div>
            )}

            <div className="mt-4 border-t border-slate-200 pt-4">
              <LogoutButton variant="full" />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {user.role === "artist" && (
            <ArtistProfileForm
              initialProfile={artistProfile}
              username={username}
            />
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Basic details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Core account data stored
                in MongoDB.
              </p>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl bg-slate-50 px-4 py-3"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-2 break-words text-sm font-semibold text-slate-950">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
