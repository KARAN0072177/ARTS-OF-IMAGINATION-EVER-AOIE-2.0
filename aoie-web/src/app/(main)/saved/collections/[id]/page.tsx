import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bookmark, FolderHeart, Images } from "lucide-react";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Collection from "@/models/Collection";
import Like from "@/models/Like";
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
};

type RawLike = {
  artwork?: Types.ObjectId | RawArtwork | null;
};

type ArtworkItem = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  isLiked: boolean;
};

function isRawArtwork(
  artwork: RawArtwork | null | undefined
): artwork is RawArtwork {
  return Boolean(artwork?._id && artwork.imageUrl);
}

function getArtworkId(artwork: Types.ObjectId | RawArtwork | null | undefined) {
  if (!artwork) return "";

  if (artwork instanceof Types.ObjectId) {
    return artwork.toString();
  }

  return artwork._id.toString();
}

function CollectionArtworkCard({ artwork }: { artwork: ArtworkItem }) {
  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="group mb-5 block break-inside-avoid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          sizes="(min-width: 1536px) 240px, (min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          unoptimized
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-950">
              {artwork.title}
            </h3>
            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {artwork.category}
            </p>
          </div>

          {artwork.isLiked && (
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
              liked
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
          <span>{artwork.likesCount} likes</span>
          <Bookmark className="h-4 w-4 text-cyan-700" />
        </div>
      </div>
    </Link>
  );
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/saved");
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();

  const userId = new Types.ObjectId(session.user.id);
  const collectionId = new Types.ObjectId(id);

  const collection = (await Collection.findOne({
    _id: collectionId,
    user: userId,
  })
    .populate({
      path: "artworks",
      select: "title imageUrl category likesCount",
    })
    .lean()) as RawCollection | null;

  if (!collection) {
    notFound();
  }

  const rawArtworks = (collection.artworks || []).filter(isRawArtwork);
  const artworkIds = rawArtworks.map((artwork) => artwork._id);

  const rawLikes =
    artworkIds.length > 0
      ? ((await Like.find({
          user: userId,
          artwork: { $in: artworkIds },
        })
          .select("artwork")
          .lean()) as RawLike[])
      : [];

  const likedArtworkIds = new Set(
    rawLikes.map((like) => getArtworkId(like.artwork)).filter(Boolean)
  );

  const artworks: ArtworkItem[] = rawArtworks.map((artwork) => ({
    id: artwork._id.toString(),
    title: artwork.title || "Untitled",
    imageUrl: artwork.imageUrl || "",
    category: artwork.category || "Other",
    likesCount: artwork.likesCount || 0,
    isLiked: likedArtworkIds.has(artwork._id.toString()),
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/saved"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to collections
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
                Collection
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-normal sm:text-5xl">
                {collection.name || "Untitled board"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {collection.description ||
                  "A focused board for saved artwork and visual references."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:min-w-48">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <FolderHeart className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold">{artworks.length}</p>
              <p className="text-sm text-slate-500">
                {artworks.length === 1 ? "saved image" : "saved images"}
              </p>
            </div>
          </div>
        </section>

        {artworks.length > 0 ? (
          <section className="columns-2 gap-5 sm:columns-3 lg:columns-4 xl:columns-5">
            {artworks.map((artwork) => (
              <CollectionArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Images className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">This board is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              Open a saved artwork and add it to this collection when you want
              it grouped here.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
