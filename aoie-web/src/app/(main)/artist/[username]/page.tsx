import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";
import Follow from "@/models/Follow";

import ArtworkCard from "@/components/artwork/ArtworkCard";

import FollowButton from "@/components/profile/FollowButton";

interface ArtistPageProps {
  params: Promise<{
    username: string;
  }>;
}

interface ArtistArtwork {
  _id: {
    toString(): string;
  };
  title: string;
  imageUrl: string;
  category: string;
}

export default async function ArtistPage({
  params,
}: ArtistPageProps) {
  const { username } = await params;

  const session =
    await getServerSession(authOptions);

  await connectDB();

  const artist = await User.findOne({
    username,
    role: "artist",
  }).lean();

  if (!artist) {
    notFound();
  }

  const artworks = (await Artwork.find({
    artist: artist._id,
    isPublished: true,
  })
    .sort({
      createdAt: -1,
    })
    .lean()) as unknown as ArtistArtwork[];

  const [
    followersCount,
    followingCount,
    existingFollow,
  ] = await Promise.all([
    Follow.countDocuments({
      following: artist._id,
    }),
    Follow.countDocuments({
      follower: artist._id,
    }),
    session?.user?.id
      ? Follow.findOne({
          follower: session.user.id,
          following: artist._id,
        }).lean()
      : null,
  ]);

  return (
    <section className="space-y-8">
      {/* Banner */}

      <div className="h-56 rounded-xl bg-slate-200" />

      {/* Profile */}

      <div className="-mt-20 px-6">
        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-4xl font-bold text-white">
          {artist.username
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold">
            {artist.artistProfile
              ?.displayName ||
              artist.username}
          </h1>

          <p className="mt-1 text-slate-500">
            @{artist.username}
          </p>

          <div className="mt-4">
            <FollowButton
              userId={artist._id.toString()}
              initialFollowing={!!existingFollow}
              initialFollowersCount={followersCount}
              initialFollowingCount={followingCount}
            />
          </div>

          {artist.artistProfile?.bio && (
            <p className="mt-4 max-w-3xl text-slate-700">
              {artist.artistProfile.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
            {artist.artistProfile?.location && (
              <span>
                📍{" "}
                {
                  artist.artistProfile
                    .location
                }
              </span>
            )}

            {artist.artistProfile?.website && (
              <a
                href={
                  artist.artistProfile
                    .website
                }
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}

      <div>
        <h2 className="mb-6 text-2xl font-semibold">
          Gallery
        </h2>

        {artworks.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-slate-500">
            No artworks uploaded yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artworks.map((artwork) => (
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
      </div>
    </section>
  );
}
