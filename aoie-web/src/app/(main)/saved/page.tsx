import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bookmark,
  FolderHeart,
  Images,
  Layers3,
  Plus,
} from "lucide-react";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Collection from "@/models/Collection";
import Like from "@/models/Like";
import Save from "@/models/Save";
import "@/models/Artwork";

type RawArtwork = {
  _id: Types.ObjectId;
  title?: string;
  imageUrl?: string;
  category?: string;
  likesCount?: number;
};

type RawCollection = {
  _id: Types.ObjectId;
  name?: string;
  description?: string;
  artworks?: Array<RawArtwork | null | undefined>;
  coverArtwork?: Types.ObjectId | RawArtwork | null;
};

type RawSave = {
  artwork?: RawArtwork | null;
};

type RawLike = {
  artwork?: Types.ObjectId | RawArtwork | null;
};

type ArtworkPreview = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  isLiked?: boolean;
};

type CollectionItem = {
  id: string;
  name: string;
  description: string;
  coverArtwork: string | null;
  artworks: ArtworkPreview[];
};

function isRawArtwork(
  artwork: RawArtwork | null | undefined
): artwork is RawArtwork {
  return Boolean(artwork?._id && artwork.imageUrl);
}

function mapArtwork(artwork: RawArtwork): ArtworkPreview {
  return {
    id: artwork._id.toString(),
    title: artwork.title || "Untitled",
    imageUrl: artwork.imageUrl || "",
    category: artwork.category || "Other",
    likesCount: artwork.likesCount || 0,
  };
}

function getArtworkId(
  artwork:
    | Types.ObjectId
    | RawArtwork
    | string
    | null
    | undefined
) {
  if (!artwork) return "";

  if (typeof artwork === "string") {
    return artwork;
  }

  if (artwork instanceof Types.ObjectId) {
    return artwork.toString();
  }

  if ("_id" in artwork && artwork._id) {
    return artwork._id.toString();
  }

  return artwork.toString();
}

function prioritizeCover(
  artworks: ArtworkPreview[],
  coverArtwork: string | null
) {
  if (!coverArtwork) return artworks;

  const cover = artworks.find(
    (artwork) => artwork.id === coverArtwork
  );

  if (!cover) return artworks;

  return [
    cover,
    ...artworks.filter(
      (artwork) => artwork.id !== coverArtwork
    ),
  ];
}

function BoardPreview({
  artworks,
  name,
}: {
  artworks: ArtworkPreview[];
  name: string;
}) {
  const coverArtworks = artworks.slice(0, 4);
  const [primary, ...secondary] = coverArtworks;

  return (
    <div className="relative h-44 overflow-hidden bg-slate-100">
      {primary ? (
        <div className="grid h-full grid-cols-[1.35fr_0.85fr] gap-1 p-1">
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src={primary.imageUrl}
              alt={primary.title}
              fill
              sizes="(min-width: 1536px) 280px, (min-width: 1280px) 360px, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="grid h-full gap-1">
            {[0, 1, 2].map((index) => {
              const artwork = secondary[index];

              if (!artwork) {
                return (
                  <div
                    key={`${name}-placeholder-${index}`}
                    className="rounded-xl bg-slate-200"
                  />
                );
              }

              return (
                <div
                  key={artwork.id}
                  className="relative min-h-0 overflow-hidden rounded-xl"
                >
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    sizes="(min-width: 1536px) 140px, (min-width: 1280px) 180px, (min-width: 640px) 22vw, 45vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <Images className="h-6 w-6" />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/45 to-transparent" />
      <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
        {artworks.length} {artworks.length === 1 ? "image" : "images"}
      </div>
    </div>
  );
}

function SavedImageCard({ artwork }: { artwork: ArtworkPreview }) {
  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          sizes="(min-width: 1280px) 220px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          unoptimized
        />
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-950">
            {artwork.title}
          </p>
          {artwork.isLiked && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
              liked
            </span>
          )}
        </div>
        <p className="truncate text-xs font-medium text-slate-500">
          {artwork.category}
        </p>
      </div>
    </Link>
  );
}

export default async function SavedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/saved");
  }

  await connectDB();

  const userId = new Types.ObjectId(session.user.id);

  const rawCollections = (await Collection.find({
    user: userId,
  })
    .populate({
      path: "artworks",
      select: "title imageUrl category likesCount",
    })
    .sort({ updatedAt: -1 })
    .lean()) as RawCollection[];

  const collections: CollectionItem[] = rawCollections.map((collection) => ({
    id: collection._id.toString(),
    name: collection.name || "Untitled board",
    description: collection.description || "",
    coverArtwork: getArtworkId(collection.coverArtwork) || null,
    artworks: prioritizeCover(
      (collection.artworks || [])
        .filter(isRawArtwork)
        .map(mapArtwork),
      getArtworkId(collection.coverArtwork) || null
    ),
  }));

  const collectionArtworkIds = new Set(
    collections.flatMap((collection) =>
      collection.artworks.map((artwork) => artwork.id)
    )
  );

  const rawSaves = (await Save.find({
    user: userId,
  })
    .populate({
      path: "artwork",
      select: "title imageUrl category likesCount",
    })
    .sort({ createdAt: -1 })
    .lean()) as RawSave[];

  const savedOutsideCollections = rawSaves
    .map((save) => save.artwork)
    .filter(isRawArtwork)
    .filter((artwork) => !collectionArtworkIds.has(artwork._id.toString()))
    .map(mapArtwork);

  const savedOutsideIds = savedOutsideCollections.map(
    (artwork) => new Types.ObjectId(artwork.id)
  );

  const rawLikes =
    savedOutsideIds.length > 0
      ? ((await Like.find({
        user: userId,
        artwork: { $in: savedOutsideIds },
      })
        .select("artwork")
        .lean()) as RawLike[])
      : [];

  const likedArtworkIds = new Set(
    rawLikes.map((like) => getArtworkId(like.artwork)).filter(Boolean)
  );

  const uncategorizedSavedItems = savedOutsideCollections.map((artwork) => ({
    ...artwork,
    isLiked: likedArtworkIds.has(artwork.id),
  }));

  const totalCollectionImages = collections.reduce(
    (total, collection) => total + collection.artworks.length,
    0
  );
  const totalSavedImages =
    totalCollectionImages + uncategorizedSavedItems.length;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
                Personal boards
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">
                Collections
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Keep saved artwork organized into focused boards for references,
                wallpapers, characters, moods, and future ideas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <FolderHeart className="h-5 w-5" />
                </div>
                <p className="mt-3 text-2xl font-bold">{collections.length}</p>
                <p className="text-sm text-slate-500">boards</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <Bookmark className="h-5 w-5" />
                </div>
                <p className="mt-3 text-2xl font-bold">{totalSavedImages}</p>
                <p className="text-sm text-slate-500">saved images</p>
              </div>
            </div>
          </div>
        </section>

        {collections.length === 0 && uncategorizedSavedItems.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <FolderHeart className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">No saved artwork yet</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              Save artwork from the feed, then group it into collections when
              you want a cleaner board.
            </p>
          </section>
        ) : (
          <>
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Your boards</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Compact previews with the details kept below the artwork.
                  </p>
                </div>
              </div>

              {collections.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/saved/collections/${collection.id}`}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                    >
                      <BoardPreview
                        artworks={collection.artworks}
                        name={collection.name}
                      />

                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-slate-950">
                            {collection.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                            {collection.description ||
                              "A focused board for saved artwork."}
                          </p>
                        </div>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-100">
                          <Layers3 className="h-5 w-5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                  <Plus className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-2">No collections yet.</p>
                </div>
              )}
            </section>

            {uncategorizedSavedItems.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Saved outside collections
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Older saves stay here until you move them into a board.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                    {uncategorizedSavedItems.length}{" "}
                    {uncategorizedSavedItems.length === 1 ? "image" : "images"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {uncategorizedSavedItems.map((artwork) => (
                    <SavedImageCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
