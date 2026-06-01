import Link from "next/link";

import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { q = "" } =
    await searchParams;

  await connectDB();

  const regex =
    new RegExp(q, "i");

  const artists =
    q.trim()
      ? await User.find({
          role: "artist",

          $or: [
            {
              username: regex,
            },
            {
              "artistProfile.displayName":
                regex,
            },
          ],
        })
          .limit(10)
          .lean()
      : [];

  const artworks =
    q.trim()
      ? await Artwork.find({
          isPublished: true,

          $or: [
            {
              title: regex,
            },
            {
              category: regex,
            },
            {
              tags: regex,
            },
          ],
        })
          .limit(20)
          .lean()
      : [];

  return (
    <section>
      <h1 className="mb-8 text-3xl font-bold">
        Search Results
      </h1>

      <p className="mb-10 text-slate-600">
        Query: "{q}"
      </p>

      {/* Artists */}

      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">
          Artists
        </h2>

        {artists.length === 0 ? (
          <p className="text-slate-500">
            No artists found.
          </p>
        ) : (
          <div className="space-y-3">
            {artists.map(
              (artist: any) => (
                <Link
                  key={artist._id.toString()}
                  href={`/artist/${artist.username}`}
                  className="block rounded-md border p-4 hover:bg-slate-50"
                >
                  <p className="font-medium">
                    {artist
                      .artistProfile
                      ?.displayName ||
                      artist.username}
                  </p>

                  <p className="text-sm text-slate-500">
                    @{artist.username}
                  </p>
                </Link>
              )
            )}
          </div>
        )}
      </div>

      {/* Artworks */}

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Artworks
        </h2>

        {artworks.length === 0 ? (
          <p className="text-slate-500">
            No artworks found.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artworks.map(
              (artwork: any) => (
                <Link
                  key={artwork._id.toString()}
                  href={`/artwork/${artwork._id}`}
                  className="overflow-hidden rounded-lg border"
                >
                  <img
                    src={
                      artwork.imageUrl
                    }
                    alt={
                      artwork.title
                    }
                    className="aspect-square w-full object-cover"
                  />

                  <div className="p-4">
                    <h3 className="font-medium">
                      {
                        artwork.title
                      }
                    </h3>

                    <p className="text-sm text-slate-500">
                      {
                        artwork.category
                      }
                    </p>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}