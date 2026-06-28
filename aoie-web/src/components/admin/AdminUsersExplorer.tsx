"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Mail,
  RefreshCw,
  Search,
  UserRound,
  X,
  Globe,
  ShieldCheck,
  Palette,
  Crown,
} from "lucide-react";
import {
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

export type AdminUserListItem = {
  id: string;
  username?: string | null;
  email: string;
  role: string;
  isVerified: boolean;
  authProviders?: string[];
  artistApplicationStatus: string;
  usernameSetupRequired: boolean;
  avatar?: string | null;
};

const roleOptions = [
  { label: "All roles", value: "all" },
  { label: "Users", value: "user" },
  { label: "Artists", value: "artist" },
  { label: "Admins", value: "admin" },
  { label: "Super admins", value: "super-admin" },
];

const verifiedOptions = [
  { label: "All status", value: "all" },
  { label: "Verified", value: "yes" },
  { label: "Unverified", value: "no" },
];

const providerOptions = [
  { label: "All logins", value: "all" },
  { label: "Email", value: "email" },
  { label: "Google", value: "google" },
];

const artistStatusConfig: Record<
  "none" | "pending" | "approved" | "rejected",
  { label: string; className: string }
> = {
  none: {
    label: "No application",
    className: "text-slate-500 font-medium",
  },
  pending: {
    label: "Pending review",
    className: "text-amber-400 font-extrabold",
  },
  approved: {
    label: "Approved artist",
    className: "text-emerald-400 font-extrabold",
  },
  rejected: {
    label: "Rejected app",
    className: "text-rose-400 font-extrabold",
  },
};

const roleConfig: Record<
  "artist" | "user" | "admin" | "super-admin",
  {
    label: string;
    className: string;
    icon: React.ReactNode;
  }
> = {
  "super-admin": {
    label: "Super admin",
    className:
      "bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black border border-rose-400/50 shadow-md shadow-rose-600/20",
    icon: <Crown className="h-3 w-3" />,
  },
  admin: {
    label: "Admin",
    className:
      "bg-purple-500/20 text-purple-300 font-black border border-purple-500/40 shadow-sm",
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  artist: {
    label: "Artist",
    className:
      "bg-cyan-500/20 text-cyan-300 font-black border border-cyan-500/40 shadow-sm",
    icon: <Palette className="h-3 w-3" />,
  },
  user: {
    label: "User",
    className:
      "bg-slate-900 text-slate-300 font-bold border border-slate-800",
    icon: <UserRound className="h-3 w-3 text-slate-400" />,
  },
};

const avatarGradients: Record<AdminUserListItem["role"], string> = {
  "super-admin": "from-rose-600 to-pink-600",
  admin: "from-purple-600 to-indigo-600",
  artist: "from-cyan-500 to-blue-600",
  user: "from-slate-700 to-slate-900",
};

function getRoleConfig(role: string) {
  if (
    role === "artist" ||
    role === "admin" ||
    role === "super-admin" ||
    role === "user"
  ) {
    return roleConfig[role];
  }

  return roleConfig.user;
}

function getArtistStatusConfig(status: string) {
  if (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "none"
  ) {
    return artistStatusConfig[status];
  }

  return artistStatusConfig.none;
}

function getAvatarGradient(role: string) {
  if (
    role === "artist" ||
    role === "admin" ||
    role === "super-admin" ||
    role === "user"
  ) {
    return avatarGradients[role];
  }

  return avatarGradients.user;
}

function providerLabel(providers?: string[]) {
  const values = providers || [];
  if (values.includes("google") && values.includes("credentials"))
    return "Email + Google";
  if (values.includes("google")) return "Google";
  return "Email";
}

function hasProvider(user: AdminUserListItem, provider: string) {
  if (provider === "all") return true;
  if (provider === "google")
    return (user.authProviders || []).includes("google");
  return (user.authProviders || []).includes("credentials");
}

function getInitial(user: AdminUserListItem) {
  return (user.username || user.email).slice(0, 1).toUpperCase();
}

type FilterKey = "query" | "role" | "verified" | "provider";

export default function AdminUsersExplorer({
  users,
}: {
  users: AdminUserListItem[];
}) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [role, setRole] = useState("all");
  const [verified, setVerified] = useState("all");
  const [provider, setProvider] = useState("all");
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        (user.username || "").toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);
      const matchesRole = role === "all" || user.role === role;
      const matchesVerified =
        verified === "all" ||
        (verified === "yes" ? user.isVerified : !user.isVerified);
      const matchesProvider = hasProvider(user, provider);
      return matchesQuery && matchesRole && matchesVerified && matchesProvider;
    });
  }, [users, submittedQuery, role, verified, provider]);

  const selectedRole =
    roleOptions.find((o) => o.value === role) || roleOptions[0];
  const selectedVerified =
    verifiedOptions.find((o) => o.value === verified) || verifiedOptions[0];
  const selectedProvider =
    providerOptions.find((o) => o.value === provider) || providerOptions[0];

  function triggerAnimation() {
    setIsAnimating(true);
    if (animationTimeoutRef.current)
      window.clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = window.setTimeout(
      () => setIsAnimating(false),
      160
    );
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    triggerAnimation();
    setSubmittedQuery(query.trim());
  }

  function resetFilters() {
    triggerAnimation();
    setQuery("");
    setSubmittedQuery("");
    setRole("all");
    setVerified("all");
    setProvider("all");
  }

  function clearFilter(key: FilterKey) {
    triggerAnimation();
    if (key === "query") { setQuery(""); setSubmittedQuery(""); }
    else if (key === "role") setRole("all");
    else if (key === "verified") setVerified("all");
    else setProvider("all");
  }

  const activeFilters = [
    submittedQuery ? { label: submittedQuery, key: "query" as FilterKey } : null,
    role !== "all" ? { label: selectedRole.label, key: "role" as FilterKey } : null,
    verified !== "all" ? { label: selectedVerified.label, key: "verified" as FilterKey } : null,
    provider !== "all" ? { label: selectedProvider.label, key: "provider" as FilterKey } : null,
  ].filter(Boolean) as { label: string; key: FilterKey }[];

  return (
    <div className="flex flex-col text-slate-100">
      {/* ── Toolbar (Dark Glass) ── */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-2xl">
        <form
          onSubmit={submitSearch}
          className="flex flex-wrap items-end gap-3"
        >
          {/* Search */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username or email…"
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 transition-all duration-150 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
            />
          </div>

          {/* Selects */}
          {[
            { id: "role", value: role, setter: setRole, options: roleOptions, label: "Role" },
            { id: "verified", value: verified, setter: setVerified, options: verifiedOptions, label: "Status" },
            { id: "provider", value: provider, setter: setProvider, options: providerOptions, label: "Login" },
          ].map((s) => (
            <div key={s.id} className="relative">
              <select
                value={s.value}
                onChange={(e) => { triggerAnimation(); s.setter(e.target.value); }}
                className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-800 bg-slate-950 px-3.5 pr-8 text-xs font-extrabold text-slate-200 outline-none transition-all duration-150 hover:border-slate-700 focus:border-cyan-500"
              >
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}

          {/* Actions */}
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-xs font-black text-white transition-all duration-150 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 active:scale-[0.98]"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/80 px-3.5 text-xs font-extrabold text-slate-300 transition-all duration-150 hover:bg-slate-700 hover:text-white active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        </form>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Active Filters:
            </span>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => clearFilter(f.key)}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-extrabold text-cyan-300 transition-all duration-150 hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-300"
              >
                {f.label}
                <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Meta bar ── */}
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/60 px-6 py-3">
        <p className="text-xs font-bold text-slate-400">
          Showing <span className="font-extrabold text-white">{filteredUsers.length}</span>{" "}
          {filteredUsers.length === 1 ? "user" : "users"}
          {activeFilters.length > 0 ? " matching filters" : " in directory"}
        </p>
        {activeFilters.length > 0 && (
          <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            Live Filtering
          </span>
        )}
      </div>

      {/* ── Table header ── */}
      {filteredUsers.length > 0 && (
        <div className="hidden border-b border-slate-800/80 bg-slate-950/90 px-6 py-3.5 lg:grid lg:grid-cols-[1fr_140px_160px_160px_32px] lg:items-center lg:gap-4">
          {["User Account", "Role Domain", "Authentication", "Account Status", ""].map((h, i) => (
            <span
              key={i}
              className="text-[11px] font-black uppercase tracking-widest text-slate-400"
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* ── List ── */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center bg-slate-950/40">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
            <UserRound className="h-6 w-6" />
          </div>
          <h3 className="text-base font-black text-white">No users found</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Try a different search term or clear active filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/80 px-4 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        </div>
      ) : (
        <div
          className={`divide-y divide-slate-800/60 bg-slate-950/40 transition-all duration-150 ${
            isAnimating ? "translate-y-0.5 opacity-50" : "opacity-100"
          }`}
        >
          {filteredUsers.map((user) => {
            const rc = getRoleConfig(user.role);
            const ac = getArtistStatusConfig(user.artistApplicationStatus);
            return (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="group flex items-center gap-4 p-5 transition-all duration-150 hover:bg-slate-900/80 lg:grid lg:grid-cols-[1fr_140px_160px_160px_32px]"
              >
                {/* Avatar + name */}
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <div
                      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl text-sm font-black text-white shadow-md ${
                        user.avatar
                          ? "bg-slate-900 border border-slate-800"
                          : `bg-gradient-to-br ${getAvatarGradient(user.role)}`
                      }`}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username || user.email}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitial(user)
                      )}
                    </div>
                    {user.isVerified && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-cyan-400 shadow-sm border border-slate-800">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white group-hover:text-cyan-300 transition">
                      {user.username ?? (
                        <span className="italic text-slate-500">
                          Username pending
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs font-mono text-slate-400">{user.email}</p>
                  </div>
                </div>

                {/* Role badge */}
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1 text-xs ${rc.className}`}
                >
                  {rc.icon}
                  {rc.label}
                </span>

                {/* Login provider */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  {(user.authProviders || []).includes("google") ? (
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  ) : (
                    <Mail className="h-3.5 w-3.5 text-purple-400" />
                  )}
                  {providerLabel(user.authProviders)}
                </div>

                {/* Verification + artist */}
                <div className="space-y-0.5">
                  <p
                    className={`text-xs font-extrabold ${
                      user.isVerified ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {user.isVerified ? "Verified" : "Unverified"}
                  </p>
                  <p className={`text-[11px] ${ac.className}`}>
                    {ac.label}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowUpRight className="h-4 w-4 text-slate-600 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
