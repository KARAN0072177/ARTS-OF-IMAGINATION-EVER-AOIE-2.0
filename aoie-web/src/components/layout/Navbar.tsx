import Link from "next/link";

import NotificationBell from "@/components/notifications/NotificationBell";

export default function Navbar() {
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
        </nav>

        {/* Right Side */}

        <div className="flex items-center gap-2">
          <NotificationBell />

          <Link
            href="/profile"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Profile
          </Link>
        </div>
      </div>
    </header>
  );
}