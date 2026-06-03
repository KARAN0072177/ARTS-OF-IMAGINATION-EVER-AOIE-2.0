import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Brush,
  Flag,
  Images,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";

import { authOptions } from "@/lib/auth";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Artist approvals",
    href: "/admin/artist-applications",
    icon: BadgeCheck,
  },
  {
    label: "Artworks",
    href: "/admin",
    icon: Images,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: Flag,
  },
  {
    label: "Users",
    href: "/admin",
    icon: Users,
  },
  {
    label: "Activity",
    href: "/admin",
    icon: Bell,
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  const isAdmin =
    session.user.role === "admin" ||
    session.user.role === "super-admin";

  if (!isAdmin) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 shadow-sm lg:block">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-2xl px-3 py-2"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Shield className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold">
              AOIE Admin
            </span>
            <span className="block text-xs font-medium text-slate-500">
              Control center
            </span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
              <Brush className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {session.user.role}
              </p>
              <p className="text-xs text-cyan-800/70">
                Admin session active
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">AOIE Admin</p>
              <p className="text-xs text-slate-500">
                {session.user.role}
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
