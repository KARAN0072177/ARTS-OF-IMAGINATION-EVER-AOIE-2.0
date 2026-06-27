import { Users } from "lucide-react";

import AdminUsersExplorer, {
  AdminUserListItem,
} from "@/components/admin/AdminUsersExplorer";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

type RawUserItem = {
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
  artistProfile?: {
    avatar?: string;
  };
};

function normalizeRole(role: string) {
  if (
    role === "artist" ||
    role === "admin" ||
    role === "super-admin" ||
    role === "user"
  ) {
    return role;
  }

  return "user";
}

function normalizeArtistStatus(status: string) {
  if (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "none"
  ) {
    return status;
  }

  return "none";
}

export default async function AdminUsersPage() {
  await connectDB();

  const [
    users,
    totalUsers,
    artistCount,
    adminCount,
    unverifiedCount,
  ] = await Promise.all([
    User.find()
      .select(
        "username email role isVerified authProviders artistApplicationStatus usernameSetupRequired artistProfile.avatar createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(200)
      .lean() as unknown as Promise<RawUserItem[]>,
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

  const clientUsers: AdminUserListItem[] =
    users.map((user) => ({
      id: user._id.toString(),
      username: user.username || null,
      email: user.email || "No email",
      role: normalizeRole(user.role),
      isVerified: Boolean(user.isVerified),
      authProviders: Array.isArray(
        user.authProviders
      )
        ? user.authProviders
        : [],
      artistApplicationStatus:
        normalizeArtistStatus(
          user.artistApplicationStatus
        ),
      usernameSetupRequired:
        Boolean(user.usernameSetupRequired),
      avatar: user.artistProfile?.avatar || null,
    }));

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

        <AdminUsersExplorer users={clientUsers} />
      </div>
    </section>
  );
}
