import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ArtistApplicationForm from "@/components/profile/ArtistApplicationForm";
import ArtistApplication from "@/models/ArtistApplication";
import User from "@/models/User";

export default async function BecomeArtistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile/become-artist");
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select("username role artistApplicationStatus")
    .lean();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "artist") {
    redirect("/profile");
  }

  const latestApplication =
    await ArtistApplication.findOne({
      user: user._id,
    })
      .sort({ createdAt: -1 })
      .select("status adminNote updatedAt")
      .lean();

  const hasPending =
    latestApplication?.status === "pending";

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
          <BadgeCheck className="h-4 w-4" />
          Artist application
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">
          Apply to become an artist
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Submit your creator details for admin review. Your account remains a
          regular user until the application is approved.
        </p>
      </div>

      {hasPending ? (
        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-8 text-cyan-950">
          <h2 className="text-2xl font-bold">
            Application under review
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-cyan-900/80">
            Your artist application is pending. You can continue browsing AOIE;
            upload access will unlock after admin approval.
          </p>
        </div>
      ) : (
        <ArtistApplicationForm
          initialDisplayName={
            user.username || "AOIE Artist"
          }
        />
      )}
    </section>
  );
}
