import Link from "next/link";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-slate-950"
          >
            AOIE 2.0
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="rounded-md px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Profile
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-slate-950 px-3 py-2 font-semibold text-white transition hover:bg-slate-800"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
