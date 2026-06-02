import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Follow from "@/models/Follow";
import Like from "@/models/Like";
import Save from "@/models/Save";
import User from "@/models/User";
import BecomeArtistButton from "@/components/profile/BecomeArtistButton";
import FollowStats from "@/components/profile/FollowStats";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select("username email role isVerified createdAt updatedAt")
    .lean();

  if (!user) {
    redirect("/login");
  }

  const details = [
    ["Username", user.username],
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
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-semibold text-white">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {user.username}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
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
        </aside>

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
    </section>
  );
}
