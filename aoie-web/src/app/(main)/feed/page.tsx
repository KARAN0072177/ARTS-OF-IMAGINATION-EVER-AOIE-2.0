import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";

import ArtworkCard from "@/components/artwork/ArtworkCard";

export default async function FeedPage() {
  await connectDB();

  const artworks = await Artwork.find({
    isPublished: true,
  })
    .sort({
      createdAt: -1,
    })
    .lean();

  return (
    <section>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Explore
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Artwork Feed
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Discover the latest artworks uploaded by artists across AOIE.
        </p>
      </div>

      {artworks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No artworks found
          </h2>

          <p className="mt-2 text-slate-500">
            Artists have not uploaded any artwork yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artworks.map((artwork: any) => (
            <ArtworkCard
              key={artwork._id.toString()}
              id={artwork._id.toString()}
              title={artwork.title}
              imageUrl={artwork.imageUrl}
              category={artwork.category}
            />
          ))}
        </div>
      )}
    </section>
  );
}