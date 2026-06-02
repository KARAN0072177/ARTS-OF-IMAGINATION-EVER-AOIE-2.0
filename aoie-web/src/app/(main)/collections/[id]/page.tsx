import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderHeart } from "lucide-react";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Collection from "@/models/Collection";
import Like from "@/models/Like";
import "@/models/Artwork";

import ArtworkCard from "@/components/artwork/ArtworkCard";

interface CollectionArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
}

interface CollectionDetail {
  _id: Types.ObjectId;
  name: string;
  description: string;
  artworks: CollectionArtwork[];
}

interface LikedItem {
  artwork: Types.ObjectId;
}

interface CollectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CollectionPage({
  params,
}: CollectionPageProps) {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();

  const collection =
    (await Collection.findOne({
      _id: id,
      user: session.user.id,
    })
      .populate({
        path: "artworks",
        select:
          "title imageUrl category likesCount",
      })
      .lean()) as unknown as CollectionDetail | null;

  if (!collection) {
    notFound();
  }

  const artworkIds = collection.artworks.map(
    (artwork) => artwork._id
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
      <Link
        href="/saved"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
      >
        <ArrowLeft size={16} />
        Collections
      </Link>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Collection
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-3 max-w-2xl text-slate-600">
                {collection.description}
              </p>
            )}
            <p className="mt-3 text-sm text-slate-500">
              {collection.artworks.length}{" "}
              {collection.artworks.length ===
              1
                ? "image"
                : "images"}
            </p>
          </div>

          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            <FolderHeart size={22} />
          </span>
        </div>
      </div>

      {collection.artworks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            This collection is empty
          </h2>

          <p className="mt-2 text-slate-500">
            Open an artwork and save it to
            this collection.
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
          {collection.artworks.map(
            (artwork) => (
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
                isSaved
              />
            )
          )}
        </div>
      )}
    </section>
  );
}
