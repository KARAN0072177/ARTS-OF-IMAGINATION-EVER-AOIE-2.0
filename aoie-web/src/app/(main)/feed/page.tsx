import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Like from "@/models/Like";

import ArtworkCard from "@/components/artwork/ArtworkCard";

interface FeedArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
}

interface ArtworkLike {
  artwork: Types.ObjectId;
}

export default async function FeedPage() {
  const session =
    await getServerSession(authOptions);

  await connectDB();

  const artworks = (await Artwork.find({
    isPublished: true,
  })
    .sort({
      createdAt: -1,
    })
    .lean()) as unknown as FeedArtwork[];

  const artworkIds = artworks.map(
    (artwork) => artwork._id
  );

  const likedArtworkIds =
    session?.user?.id && artworkIds.length > 0
      ? ((await Like.find({
          user: session.user.id,
          artwork: {
            $in: artworkIds,
          },
        })
          .select("artwork")
          .lean()) as unknown as ArtworkLike[])
      : ([] as ArtworkLike[]);

  const likedSet = new Set(
    likedArtworkIds.map((like) =>
      like.artwork.toString()
    )
  );

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
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork._id.toString()}
              id={artwork._id.toString()}
              title={artwork.title}
              imageUrl={artwork.imageUrl}
              category={artwork.category}
              likesCount={artwork.likesCount}
              isLiked={likedSet.has(
                artwork._id.toString()
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
