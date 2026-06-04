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
    className: "text-slate-400",
  },
  pending: {
    label: "Pending review",
    className: "text-amber-500",
  },
  approved: {
    label: "Approved",
    className: "text-emerald-600",
  },
  rejected: {
    label: "Rejected",
    className: "text-rose-500",
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
      "bg-slate-900 text-white border border-slate-800",
    icon: <Crown className="h-3 w-3" />,
  },
  admin: {
    label: "Admin",
    className:
      "bg-violet-50 text-violet-700 border border-violet-100",
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  artist: {
    label: "Artist",
    className:
      "bg-cyan-50 text-cyan-700 border border-cyan-100",
    icon: <Palette className="h-3 w-3" />,
  },
  user: {
    label: "User",
    className:
      "bg-slate-50 text-slate-500 border border-slate-200",
    icon: <UserRound className="h-3 w-3" />,
  },
};

const avatarGradients: Record<AdminUserListItem["role"], string> = {
  "super-admin": "from-slate-800 to-slate-950",
  admin: "from-violet-500 to-violet-700",
  artist: "from-cyan-400 to-teal-600",
  user: "from-slate-400 to-slate-600",
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
    <div className="flex flex-col">
      {/* ── Toolbar ── */}
      <div className="border-b border-slate-100 bg-white">
        <form
          onSubmit={submitSearch}
          className="flex flex-wrap items-end gap-3 p-5"
        >
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username or email…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 transition-all duration-150 focus:border-cyan-400 focus:bg-white focus:ring-[3px] focus:ring-cyan-100"
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
                className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-0 pl-3.5 pr-8 text-sm font-medium text-slate-700 outline-none transition-all duration-150 hover:border-slate-300 focus:border-cyan-400 focus:ring-[3px] focus:ring-cyan-100"
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
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-slate-800 active:scale-[0.98]"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-500 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        </form>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Filters
            </span>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => clearFilter(f.key)}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                {f.label}
                <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Meta bar ── */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-2.5">
        <p className="text-xs font-semibold text-slate-500">
          <span className="font-bold text-slate-700">{filteredUsers.length}</span>{" "}
          {filteredUsers.length === 1 ? "user" : "users"}
          {activeFilters.length > 0 ? " matching filters" : " total"}
        </p>
        {activeFilters.length > 0 && (
          <span className="text-[11px] font-medium text-slate-400">
            Filtering in real time
          </span>
        )}
      </div>

      {/* ── Table header ── */}
      {filteredUsers.length > 0 && (
        <div className="hidden border-b border-slate-100 bg-slate-50/50 px-5 py-2 lg:grid lg:grid-cols-[1fr_130px_160px_150px_28px] lg:items-center lg:gap-4">
          {["User", "Role", "Login", "Status", ""].map((h, i) => (
            <span
              key={i}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* ── List ── */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <UserRound className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No users found</h3>
          <p className="mt-1 text-sm text-slate-400">
            Try a different search term or clear one of the filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        </div>
      ) : (
        <div
          className={`divide-y divide-slate-100 transition-all duration-150 ${
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
                className="group flex items-center gap-4 p-5 transition-all duration-150 hover:bg-slate-50/80 lg:grid lg:grid-cols-[1fr_130px_160px_150px_28px]"
              >
                {/* Avatar + name */}
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${getAvatarGradient(user.role)}`}
                  >
                    {getInitial(user)}
                    {user.isVerified && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                        <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user.username ?? (
                        <span className="italic text-slate-400">
                          Username pending
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>

                {/* Role badge */}
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${rc.className}`}
                >
                  {rc.icon}
                  {rc.label}
                </span>

                {/* Login provider */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  {(user.authProviders || []).includes("google") ? (
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  {providerLabel(user.authProviders)}
                </div>

                {/* Verification + artist */}
                <div className="space-y-0.5">
                  <p
                    className={`text-xs font-semibold ${
                      user.isVerified ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {user.isVerified ? "Verified" : "Unverified"}
                  </p>
                  <p className={`text-[11px] font-medium ${ac.className}`}>
                    {ac.label}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-500" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
