import Link from "next/link";
import { LogIn, Shield } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

export default async function Navbar() {
  const session =
    await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "super-admin";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}

        <Link
          href="/"
          className="text-lg font-bold tracking-tight"
        >
          AOIE 2.0
        </Link>

        {/* Navigation */}

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/feed"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Feed
          </Link>

          <Link
            href="/search"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Search
          </Link>

          <Link
            href="/upload"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Upload
          </Link>

          <Link
            href="/saved"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Saved
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Side */}

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <NotificationBell />

              <Link
                href="/profile"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Profile
              </Link>

              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <LogIn size={16} />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
