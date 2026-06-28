import { Sparkles, Users } from "lucide-react";

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
    <section className="space-y-6 text-slate-100">
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
        {/* Dark Glass Hero Banner */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-inner">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                User Operations & Directory
              </p>
              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                User Management <Sparkles className="h-6 w-6 text-cyan-400" />
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                Search accounts, inspect login methods, review artist status, and manage account roles from one unified admin queue.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-[520px] sm:grid-cols-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Users</p>
                <p className="mt-1 text-2xl font-black text-white">{totalUsers}</p>
              </div>
              <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-cyan-400 tracking-wider">Artists</p>
                <p className="mt-1 text-2xl font-black text-white">{artistCount}</p>
              </div>
              <div className="rounded-3xl border border-purple-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-purple-400 tracking-wider">Admins</p>
                <p className="mt-1 text-2xl font-black text-white">{adminCount}</p>
              </div>
              <div className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl text-center">
                <p className="text-xs font-black uppercase text-amber-400 tracking-wider">Unverified</p>
                <p className="mt-1 text-2xl font-black text-white">{unverifiedCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/40">
          <AdminUsersExplorer users={clientUsers} />
        </div>
      </div>
    </section>
  );
}
