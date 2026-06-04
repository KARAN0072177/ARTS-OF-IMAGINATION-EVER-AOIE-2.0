import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Mail,
  UserRound,
  Users,
} from "lucide-react";

import AdminUserFilters from "@/components/admin/AdminUserFilters";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

type UserItem = {
  _id: {
    toString(): string;
  };
  username?: string | null;
  email: string;
  role: "artist" | "user" | "admin" | "super-admin";
  isVerified: boolean;
  authProviders?: string[];
  artistApplicationStatus:
    | "none"
    | "pending"
    | "approved"
    | "rejected";
  usernameSetupRequired: boolean;
  createdAt: Date;
};

const roleOptions = [
  "all",
  "user",
  "artist",
  "admin",
  "super-admin",
];

const verifiedOptions = ["all", "yes", "no"];
const providerOptions = [
  "all",
  "email",
  "google",
];

function roleClass(role: UserItem["role"]) {
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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    verified?: string;
    provider?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const role =
    params.role && roleOptions.includes(params.role)
      ? params.role
      : "all";
  const verified = params.verified || "all";
  const safeVerified =
    verifiedOptions.includes(verified)
      ? verified
      : "all";
  const provider = params.provider || "all";
  const safeProvider =
    providerOptions.includes(provider)
      ? provider
      : "all";

  await connectDB();

  const query: Record<string, unknown> = {};

  if (q) {
    query.$or = [
      {
        username: {
          $regex: q,
          $options: "i",
        },
      },
      {
        email: {
          $regex: q,
          $options: "i",
        },
      },
    ];
  }

  if (role !== "all") {
    query.role = role;
  }

  if (safeVerified === "yes") {
    query.isVerified = true;
  }

  if (safeVerified === "no") {
    query.isVerified = false;
  }

  if (safeProvider === "google") {
    query.authProviders = "google";
  }

  if (safeProvider === "email") {
    query.authProviders = "credentials";
  }

  const [
    users,
    totalUsers,
    artistCount,
    adminCount,
    unverifiedCount,
  ] = await Promise.all([
    User.find(query)
      .select(
        "username email role isVerified authProviders artistApplicationStatus usernameSetupRequired createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(80)
      .lean() as unknown as Promise<UserItem[]>,
    User.countDocuments(),
    User.countDocuments({
      role: "artist",
    }),
    User.countDocuments({
      role: {
        $in: ["admin", "super-admin"],
      },
    }),
    User.countDocuments({
      isVerified: false,
    }),
  ]);

  const hasActiveFilters =
    q ||
    role !== "all" ||
    safeVerified !== "all" ||
    safeProvider !== "all";

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-white p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-700">
            <Users className="h-4 w-4" />
            Account management
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                Users
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Search accounts, inspect login methods, review artist status,
                and manage account roles from one admin queue.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:w-[520px] sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold text-slate-500">
                  Users
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {totalUsers}
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-white p-3">
                <p className="text-xs font-bold text-cyan-700">
                  Artists
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {artistCount}
                </p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-white p-3">
                <p className="text-xs font-bold text-violet-700">
                  Admins
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {adminCount}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-3">
                <p className="text-xs font-bold text-amber-700">
                  Unverified
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {unverifiedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <AdminUserFilters
          q={q}
          role={role}
          verified={safeVerified}
          provider={safeProvider}
        />

        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-slate-700">
            Showing {users.length} user
            {users.length === 1 ? "" : "s"}
            {hasActiveFilters ? " matching filters" : ""}
          </p>
          {hasActiveFilters && (
            <p className="text-xs font-semibold text-slate-500">
              Filters are applied from the URL, so this view is shareable.
            </p>
          )}
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-700">
              <UserRound className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold">
              No users found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Try a different search or clear one of the filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <Link
                key={user._id.toString()}
                href={`/admin/users/${user._id.toString()}`}
                className="group grid gap-4 p-5 transition duration-200 hover:bg-cyan-50/40 lg:grid-cols-[1fr_150px_170px_160px_32px] lg:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-extrabold text-white shadow-sm transition group-hover:scale-[1.03]">
                    {(user.username || user.email)
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-extrabold">
                        {user.username || "Username pending"}
                      </h3>
                      {user.isVerified && (
                        <BadgeCheck className="h-4 w-4 text-cyan-600" />
                      )}
                    </div>
                    <p className="truncate text-sm text-slate-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold capitalize transition group-hover:shadow-sm ${roleClass(user.role)}`}
                >
                  {user.role}
                </span>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {providerLabel(user.authProviders)}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {user.isVerified
                      ? "Verified"
                      : "Unverified"}
                  </p>
                  <p className="text-xs capitalize text-slate-500">
                    Artist: {user.artistApplicationStatus}
                  </p>
                </div>

                <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-700" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
