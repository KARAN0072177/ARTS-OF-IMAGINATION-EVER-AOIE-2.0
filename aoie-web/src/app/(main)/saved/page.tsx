import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Save from "@/models/Save";

import ArtworkCard from "@/components/artwork/ArtworkCard";

export default async function SavedPage() {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const savedArtworks =
    await Save.find({
      user: session.user.id,
    })
      .populate("artwork")
      .sort({
        createdAt: -1,
      })
      .lean();

  return (
    <section>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Personal Collection
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Saved Artworks
        </h1>

        <p className="mt-3 text-slate-600">
          Artworks you've saved for
          inspiration and future
          reference.
        </p>
      </div>

      {savedArtworks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No saved artworks yet
          </h2>

          <p className="mt-2 text-slate-500">
            Start exploring and save
            artworks you like.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedArtworks.map(
            (saved: any) => (
              <ArtworkCard
                key={
                  saved.artwork._id.toString()
                }
                id={saved.artwork._id.toString()}
                title={
                  saved.artwork.title
                }
                imageUrl={
                  saved.artwork.imageUrl
                }
                category={
                  saved.artwork.category
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}