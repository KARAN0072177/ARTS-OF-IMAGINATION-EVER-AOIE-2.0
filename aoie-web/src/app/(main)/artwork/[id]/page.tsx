import Link from "next/link";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";

import CommentSection from "@/components/comment/CommentSection";

interface ArtworkPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface PopulatedArtist {
  username: string;
  artistProfile?: {
    displayName?: string;
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ArtworkPage({
  params,
}: ArtworkPageProps) {
  const { id } = await params;

  await connectDB();

  const artwork = await Artwork.findById(id)
    .populate(
      "artist",
      "username artistProfile"
    )
    .lean();

  if (!artwork) {
    notFound();
  }

  const artist =
    artwork.artist as unknown as PopulatedArtist;

  const displayName =
    artist.artistProfile
      ?.displayName ||
    artist.username;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        {/* Artwork */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="w-full object-cover"
          />
        </div>

        {/* Details */}

        <aside className="space-y-6">
          <div>
            <p className="text-sm font-medium text-cyan-600">
              {artwork.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              {artwork.title}
            </h1>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Artist
            </h2>

            <Link
              href={`/artist/${artist.username}`}
              className="font-medium text-slate-950 hover:text-cyan-600"
            >
              {displayName}
            </Link>

            <p className="text-sm text-slate-500">
              @{artist.username}
            </p>
          </div>

          {artwork.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Description
              </h2>

              <p className="whitespace-pre-wrap text-slate-700">
                {artwork.description}
              </p>
            </div>
          )}

          {artwork.tags.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tags
              </h2>

              <div className="flex flex-wrap gap-2">
                {artwork.tags.map(
                  (tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    >
                      #{tag}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 p-4">
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Views
                </dt>

                <dd className="font-medium">
                  {artwork.views}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Likes
                </dt>

                <dd className="font-medium">
                  {artwork.likesCount}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Uploaded
                </dt>

                <dd className="font-medium">
                  {formatDate(
                    artwork.createdAt
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* comment section */}

        <CommentSection
          artworkId={artwork._id.toString()}
        />
      </div>
    </section>
  );
}
