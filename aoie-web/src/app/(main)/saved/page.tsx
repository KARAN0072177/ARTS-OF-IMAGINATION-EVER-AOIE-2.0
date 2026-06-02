import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Save from "@/models/Save";
import Like from "@/models/Like";

import ArtworkCard from "@/components/artwork/ArtworkCard";

interface SavedArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
}

interface SavedItem {
  _id: Types.ObjectId;
  artwork: SavedArtwork | null;
}

interface LikedItem {
  artwork: Types.ObjectId;
}

export default async function SavedPage() {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const savedArtworks = (await Save.find({
      user: session.user.id,
    })
      .populate("artwork")
      .sort({
        createdAt: -1,
      })
      .lean()) as unknown as SavedItem[];

  const savedArtworkItems =
    savedArtworks.filter(
      (
        saved
      ): saved is SavedItem & {
        artwork: SavedArtwork;
      } => Boolean(saved.artwork)
    );

  const artworkIds =
    savedArtworkItems.map(
      (saved) => saved.artwork._id
    );

  const likedItems =
    artworkIds.length > 0
      ? ((await Like.find({
          user: session.user.id,
          artwork: {
            $in: artworkIds,
          },
        })
          .select("artwork")
          .lean()) as unknown as LikedItem[])
      : [];

  const likedSet = new Set(
    likedItems.map((item) =>
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
          Saved Artworks
        </h1>

        <p className="mt-3 text-slate-600">
          Artworks you&apos;ve saved for
          inspiration and future
          reference.
        </p>
      </div>

      {savedArtworkItems.length === 0 ? (
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
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
          {savedArtworkItems.map(
            (saved) => (
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
                likesCount={
                  saved.artwork.likesCount
                }
                isLiked={likedSet.has(
                  saved.artwork._id.toString()
                )}
                isSaved
              />
            )
          )}
        </div>
      )}
    </section>
  );
}
