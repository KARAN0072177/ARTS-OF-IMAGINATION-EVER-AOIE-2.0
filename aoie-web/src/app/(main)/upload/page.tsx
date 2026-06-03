import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Clock, UserRound } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

import UploadArtworkForm from "@/components/artwork/UploadArtworkForm";

export default async function UploadPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(
    session.user.id
  )
    .select("role artistApplicationStatus")
    .lean();

  if (!user) {
    redirect("/login");
  }

  const isArtist = user.role === "artist";

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Artist Studio
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Upload Artwork
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Add the artwork, details, and tags people need to discover your work.
        </p>
      </div>

      {isArtist ? (
        <UploadArtworkForm />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            {user.artistApplicationStatus ===
            "pending" ? (
              <Clock size={24} />
            ) : (
              <UserRound size={24} />
            )}
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            Artist approval required
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {user.artistApplicationStatus ===
            "pending"
              ? "Your artist application is currently under review. Upload access will unlock after approval."
              : "Uploading artwork is available only after your artist application is approved by an admin."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={
                user.artistApplicationStatus ===
                "pending"
                  ? "/profile"
                  : "/profile/become-artist"
              }
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {user.artistApplicationStatus ===
              "pending" ? (
                "View profile"
              ) : (
                <>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Apply to become an artist
                </>
              )}
            </Link>

            <Link
              href="/feed"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Browse artwork
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
