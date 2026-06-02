import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark, FolderHeart } from "lucide-react";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Collection from "@/models/Collection";
import Like from "@/models/Like";
import Save from "@/models/Save";
import "@/models/Artwork";

import ArtworkCard from "@/components/artwork/ArtworkCard";

interface ArtworkPreview {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
}

interface CollectionItem {
  _id: Types.ObjectId;
  name: string;
  description: string;
  artworks: ArtworkPreview[];
  updatedAt: Date;
}

interface SavedItem {
  _id: Types.ObjectId;
  artwork: ArtworkPreview | null;
}

interface LikedItem {
  artwork: Types.ObjectId;
}

export default async function SavedPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const collections =
    (await Collection.find({
      user: session.user.id,
    })
      .populate({
        path: "artworks",
        select:
          "title imageUrl category likesCount",
      })
      .sort({ updatedAt: -1 })
      .lean()) as unknown as CollectionItem[];

  const collectionArtworkIds = new Set(
    collections.flatMap((collection) =>
      collection.artworks.map((artwork) =>
        artwork._id.toString()
      )
    )
  );

  const savedArtworks =
    (await Save.find({
      user: session.user.id,
    })
      .populate({
        path: "artwork",
        select:
          "title imageUrl category likesCount",
      })
      .sort({
        createdAt: -1,
      })
      .lean()) as unknown as SavedItem[];

  const uncategorizedSavedItems =
    savedArtworks.filter(
      (
        saved
      ): saved is SavedItem & {
        artwork: ArtworkPreview;
      } => {
        if (!saved.artwork) {
          return false;
        }

        return !collectionArtworkIds.has(
          saved.artwork._id.toString()
        );
      }
    );

  const uncategorizedIds =
    uncategorizedSavedItems.map((saved) =>
      saved.artwork._id.toString()
    );

  const likedItems =
    uncategorizedIds.length > 0
      ? ((await Like.find({
          user: session.user.id,
          artwork: {
            $in: uncategorizedIds,
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

  const hasSavedContent =
    collections.length > 0 ||
    uncategorizedSavedItems.length > 0;

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Personal Boards
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-950">
            Collections
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Save artwork into focused
            boards like Anime Inspiration,
            Wallpapers, Character Design,
            or Favorite Landscapes.
          </p>
        </div>
      </div>

      {!hasSavedContent ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            <FolderHeart size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No collections yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Open an image, use the
            bookmark button, and create
            your first collection.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {collections.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map(
                (collection) => {
                  const previews =
                    collection.artworks.slice(
                      0,
                      4
                    );

                  return (
                    <Link
                      key={collection._id.toString()}
                      href={`/collections/${collection._id.toString()}`}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                    >
                      <div className="grid aspect-[4/3] grid-cols-2 gap-1 bg-slate-100 p-1">
                        {previews.length > 0 ? (
                          previews.map(
                            (artwork) => (
                              <img
                                key={artwork._id.toString()}
                                src={
                                  artwork.imageUrl
                                }
                                alt={
                                  artwork.title
                                }
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full rounded-md object-cover"
                              />
                            )
                          )
                        ) : (
                          <div className="col-span-2 flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400">
                            <Bookmark
                              size={24}
                            />
                          </div>
                        )}

                        {Array.from({
                          length: Math.max(
                            0,
                            4 -
                              previews.length
                          ),
                        }).map((_, index) => (
                          <div
                            key={index}
                            className="rounded-md bg-slate-200/70"
                          />
                        ))}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold text-slate-950">
                              {collection.name}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                              {
                                collection.artworks
                                  .length
                              }{" "}
                              {collection
                                .artworks
                                .length === 1
                                ? "image"
                                : "images"}
                            </p>
                          </div>

                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-100">
                            <FolderHeart
                              size={18}
                            />
                          </span>
                        </div>

                        {collection.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                            {
                              collection.description
                            }
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}

          {uncategorizedSavedItems.length >
            0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-950">
                  Saved outside collections
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Older saves are still
                  here. Open an image to
                  move it into a collection.
                </p>
              </div>

              <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
                {uncategorizedSavedItems.map(
                  (saved) => (
                    <ArtworkCard
                      key={saved.artwork._id.toString()}
                      id={saved.artwork._id.toString()}
                      title={saved.artwork.title}
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
            </section>
          )}
        </div>
      )}
    </section>
  );
}
