import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  Heart,
  Mail,
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select(
      "username email role isVerified authProviders usernameSetupRequired artistProfile createdAt updatedAt"
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
    ["Email status", user.isVerified ? "Verified" : "Not verified"],
    ["Joined", formatDate(user.createdAt)],
    ["Last updated", formatDate(user.updatedAt)],
  ];

  const [
    followersCount,
    followingCount,
    likedImagesCount,
    savedImagesCount,
  ] =
    await Promise.all([
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
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Account
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Basic account details stored in MongoDB for your logged-in user.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {user.role === "artist" && (
            <div className="-mx-6 -mt-6 mb-6 overflow-hidden rounded-t-lg bg-slate-100">
              <div className="h-32 bg-slate-200">
                {artistProfile.banner && (
                  <img
                    src={artistProfile.banner}
                    alt="Artist banner"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-lg font-semibold text-white">
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
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {publicDisplayName}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                @{username}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold capitalize text-cyan-700">
              {user.role}
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {user.isVerified
                ? "Verified email"
                : "Email pending"}
            </span>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Current login
            </p>

            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                {loginProvider ===
                "google" ? (
                  <FcGoogle size={22} />
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
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

          <div className="mt-5">
            <FollowStats
              userId={user._id.toString()}
              followersCount={followersCount}
              followingCount={followingCount}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/liked"
              className="rounded-lg border border-rose-100 bg-rose-50 p-4 transition hover:border-rose-200 hover:bg-rose-100"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
                <Heart
                  size={18}
                  className="fill-rose-500"
                />
              </span>
              <span className="mt-3 block text-sm font-semibold text-slate-950">
                Liked Images
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                {likedImagesCount}{" "}
                {likedImagesCount === 1
                  ? "image"
                  : "images"}
              </span>
            </Link>

            <Link
              href="/saved"
              className="rounded-lg border border-cyan-100 bg-cyan-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-100"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm">
                <Bookmark
                  size={18}
                  className="fill-cyan-600"
                />
              </span>
              <span className="mt-3 block text-sm font-semibold text-slate-950">
                Saved Images
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                {savedImagesCount}{" "}
                {savedImagesCount === 1
                  ? "image"
                  : "images"}
              </span>
            </Link>
          </div>

          {user.role === "user" ? (
            <BecomeArtistButton />
          ) : (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Artist account active
            </div>
          )}

          <div className="mt-4 border-t border-slate-200 pt-4">
            <LogoutButton variant="full" />
          </div>
        </aside>

        <div className="space-y-6">
          {user.role === "artist" && (
            <ArtistProfileForm
              initialProfile={artistProfile}
              username={username}
            />
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Basic details
            </h2>

            <dl className="mt-5 divide-y divide-slate-200">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6"
                >
                  <dt className="text-sm font-medium text-slate-500">
                    {label}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-950">
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