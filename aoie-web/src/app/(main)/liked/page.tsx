import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Like from "@/models/Like";
import Save from "@/models/Save";

import ArtworkCard from "@/components/artwork/ArtworkCard";

interface LikedArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  placeholderUrl?: string;
}

interface LikedItem {
  _id: Types.ObjectId;
  artwork: LikedArtwork | null;
}

interface SavedItem {
  artwork: Types.ObjectId;
}

export default async function LikedPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const likedArtworks = (await Like.find({
    user: session.user.id,
  })
    .populate("artwork")
    .sort({
      createdAt: -1,
    })
    .lean()) as unknown as LikedItem[];

  const likedArtworkItems =
    likedArtworks.filter(
      (
        liked
      ): liked is LikedItem & {
        artwork: LikedArtwork;
      } => Boolean(liked.artwork)
    );

  const artworkIds = likedArtworkItems.map(
    (liked) => liked.artwork._id
  );

  const savedItems =
    artworkIds.length > 0
      ? ((await Save.find({
          user: session.user.id,
          artwork: {
            $in: artworkIds,
          },
        })
          .select("artwork")
          .lean()) as unknown as SavedItem[])
      : [];

  const savedSet = new Set(
    savedItems.map((item) =>
      item.artwork.toString()
    )
  );

  return (
    <section>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Personal Collection
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Liked Images
        </h1>

        <p className="mt-3 text-slate-600">
          Images you&apos;ve liked while
          exploring AOIE.
        </p>
      </div>

      {likedArtworkItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No liked images yet
          </h2>

          <p className="mt-2 text-slate-500">
            Like images from the feed to
            build this collection.
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
          {likedArtworkItems.map((liked, index) => {
            const artworkId =
              liked.artwork._id.toString();

            return (
              <ArtworkCard
                key={artworkId}
                id={artworkId}
                title={liked.artwork.title}
                imageUrl={
                  liked.artwork.imageUrl
                }
                category={
                  liked.artwork.category
                }
                likesCount={
                  liked.artwork.likesCount
                }
                isLiked
                isSaved={savedSet.has(
                  artworkId
                )}
                priority={index < 8}
                placeholderUrl={liked.artwork.placeholderUrl}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
