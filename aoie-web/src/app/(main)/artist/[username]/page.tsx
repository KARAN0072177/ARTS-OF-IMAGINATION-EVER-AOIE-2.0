import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";
import Follow from "@/models/Follow";
import Like from "@/models/Like";
import Save from "@/models/Save";

import ArtworkCard from "@/components/artwork/ArtworkCard";

import FollowButton from "@/components/profile/FollowButton";

interface ArtistPageProps {
  params: Promise<{
    username: string;
  }>;
}

interface ArtistArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  placeholderUrl?: string;
}

interface ArtworkLike {
  artwork: Types.ObjectId;
}

interface ArtworkSave {
  artwork: Types.ObjectId;
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

  if (!artist || !artist.username) {
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
    likedArtworkIds,
    savedArtworkIds,
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
    session?.user?.id && artworks.length > 0
      ? ((await Like.find({
          user: session.user.id,
          artwork: {
            $in: artworks.map(
              (artwork) => artwork._id
            ),
          },
        })
          .select("artwork")
          .lean()) as unknown as ArtworkLike[])
      : ([] as ArtworkLike[]),
    session?.user?.id && artworks.length > 0
      ? ((await Save.find({
          user: session.user.id,
          artwork: {
            $in: artworks.map(
              (artwork) => artwork._id
            ),
          },
        })
          .select("artwork")
          .lean()) as unknown as ArtworkSave[])
      : ([] as ArtworkSave[]),
  ]);

  const likedSet = new Set(
    likedArtworkIds.map((like) =>
      like.artwork.toString()
    )
  );
  const savedSet = new Set(
    savedArtworkIds.map((save) =>
      save.artwork.toString()
    )
  );
  const displayName =
    artist.artistProfile?.displayName ||
    artist.username;
  const avatar =
    artist.artistProfile?.avatar || "";
  const banner =
    artist.artistProfile?.banner || "";

  return (
    <section className="space-y-8">
      <div className="h-56 overflow-hidden rounded-xl bg-slate-200">
        {banner && (
          <img
            src={banner}
            alt={`${displayName} banner`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="-mt-20 px-6">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-950 text-4xl font-bold text-white shadow-sm">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            displayName
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold">
            {displayName}
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
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} />
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
                className="inline-flex items-center gap-1.5 font-semibold text-cyan-700 hover:text-cyan-800"
              >
                Website
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold">
          Gallery
        </h2>

        {artworks.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-slate-500">
            No artworks uploaded yet.
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
            {artworks.map((artwork, index) => (
              <ArtworkCard
                key={artwork._id.toString()}
                id={artwork._id.toString()}
                title={artwork.title}
                imageUrl={artwork.imageUrl}
                category={artwork.category}
                artistName={displayName}
                artistUsername={username}
                artistAvatar={avatar}
                likesCount={artwork.likesCount}
                isLiked={likedSet.has(
                  artwork._id.toString()
                )}
                isSaved={savedSet.has(
                  artwork._id.toString()
                )}
                priority={index < 8}
                placeholderUrl={artwork.placeholderUrl}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
