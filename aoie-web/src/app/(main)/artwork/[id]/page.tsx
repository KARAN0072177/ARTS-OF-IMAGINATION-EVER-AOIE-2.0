import { Metadata } from "next";
import Link from "next/link";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Eye,
  Hash,
  MessageCircle,
  User,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Comment from "@/models/Comment";
import CommentLike from "@/models/CommentLike";
import Like from "@/models/Like";
import Save from "@/models/Save";

import CommentSection, {
  ArtworkComment,
} from "@/components/comment/CommentSection";

import ArtworkDetailActions from "@/components/artwork/ArtworkDetailActions";

interface ArtworkPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface PopulatedArtist {
  username: string;
  artistProfile?: {
    avatar?: string;
    displayName?: string;
  };
}

interface RawComment {
  _id: Types.ObjectId;
  content: string;
  likesCount?: number;
  createdAt: Date;
  parentComment?: {
    toString(): string;
  } | null;
  user: {
    _id: {
      toString(): string;
    };
    username: string;
    role?: string;
    artistProfile?: {
      displayName?: string;
    };
  };
}

function serializeComment(
  comment: RawComment,
  replies: RawComment[] = [],
  likedSet = new Set<string>(),
  likeCountMap = new Map<string, number>()
): ArtworkComment {
  const commentId = comment._id.toString();

  return {
    _id: commentId,
    content: comment.content,
    likesCount:
      likeCountMap.get(commentId) ??
      comment.likesCount ??
      0,
    isLiked: likedSet.has(commentId),
    createdAt: comment.createdAt.toISOString(),
    parentComment:
      comment.parentComment?.toString() ||
      null,
    user: {
      _id: comment.user._id.toString(),
      username: comment.user.username,
      role: comment.user.role,
      artistProfile:
        comment.user.artistProfile,
    },
    replies: replies.map((reply) =>
      serializeComment(
        reply,
        [],
        likedSet,
        likeCountMap
      )
    ),
  };
}
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export async function generateMetadata({
  params,
}: ArtworkPageProps): Promise<Metadata> {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return {};
  }

  await connectDB();

  const artwork = await Artwork.findById(id)
    .populate("artist", "username artistProfile")
    .lean();

  if (!artwork) {
    return {};
  }

  const artist = artwork.artist as unknown as PopulatedArtist;
  const displayName = artist?.artistProfile?.displayName || artist?.username || "Anonymous Artist";
  const ogImageUrl = `/api/artwork/${id}/og`;

  return {
    title: `${artwork.title} by ${displayName} | AOIE 2.0`,
    description: artwork.description || `Check out ${artwork.title} by ${displayName} on Arts of Imagination Ever.`,
    openGraph: {
      title: artwork.title,
      description: artwork.description || `Check out ${artwork.title} by ${displayName} on Arts of Imagination Ever.`,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: artwork.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: artwork.title,
      description: artwork.description || `Check out ${artwork.title} by ${displayName} on Arts of Imagination Ever.`,
      images: [ogImageUrl],
    },
  };
}
export default async function ArtworkPage({
  params,
}: ArtworkPageProps) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  const session =
    await getServerSession(authOptions);

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

  const existingSave =
    session?.user?.id
      ? await Save.findOne({
          user: session.user.id,
          artwork: artwork._id,
        }).lean()
      : null;

  const existingLike =
    session?.user?.id
      ? await Like.findOne({
          user: session.user.id,
          artwork: artwork._id,
        }).lean()
      : null;

  const comments = (await Comment.find({
    artwork: artwork._id,
    parentComment: null,
  })
    .populate(
      "user",
      "username role artistProfile"
    )
    .sort({
      createdAt: -1,
    })
    .lean()) as unknown as RawComment[];

  const commentIds = comments.map(
    (comment) => comment._id
  );

  const replies =
    commentIds.length > 0
      ? ((await Comment.find({
        artwork: artwork._id,
        parentComment: {
          $in: commentIds,
        },
      })
        .populate(
          "user",
          "username role artistProfile"
        )
        .sort({
          createdAt: 1,
        })
        .lean()) as unknown as RawComment[])
      : [];

  const allCommentIds = [
    ...commentIds,
    ...replies.map((reply) => reply._id),
  ];

  const likedComments =
    session?.user?.id &&
      allCommentIds.length > 0
      ? ((await CommentLike.find({
        user: session.user.id,
        comment: {
          $in: allCommentIds,
        },
      })
        .select("comment")
        .lean()) as unknown as Array<{
          comment: Types.ObjectId;
        }>)
      : [];

  const likedSet = new Set(
    likedComments.map((like) =>
      like.comment.toString()
    )
  );

  const likeCounts =
    allCommentIds.length > 0
      ? ((await CommentLike.aggregate([
        {
          $match: {
            comment: {
              $in: allCommentIds,
            },
          },
        },
        {
          $group: {
            _id: "$comment",
            count: {
              $sum: 1,
            },
          },
        },
      ])) as Array<{
        _id: Types.ObjectId;
        count: number;
      }>)
      : [];

  const likeCountMap = new Map(
    likeCounts.map((item) => [
      item._id.toString(),
      item.count,
    ])
  );

  const commentsWithReplies =
    comments.map((comment) =>
      serializeComment(
        comment,
        replies.filter(
          (reply) =>
            reply.parentComment?.toString() ===
            comment._id.toString()
        ),
        likedSet,
        likeCountMap
      )
    );

  const totalCommentCount =
    commentsWithReplies.reduce(
      (total, comment) =>
        total +
        1 +
        (comment.replies?.length || 0),
      0
    );

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-15 blur-2xl"
          style={{
            backgroundImage: `url("${artwork.imageUrl}")`,
          }}
        />
        <div className="absolute inset-0 bg-white/80" />

        <div className="relative grid lg:grid-cols-[minmax(0,1fr)_410px]">
          <div className="flex min-h-[58vh] items-center justify-center p-3 sm:p-5 lg:min-h-[78vh] lg:p-8">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-slate-950 shadow-2xl ring-1 ring-slate-950/10">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="max-h-[74vh] w-full object-contain"
              />
            </div>
          </div>

          <aside className="border-t border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl lg:border-l lg:border-t-0 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                {artwork.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                <MessageCircle size={13} />
                {totalCommentCount}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950">
              {artwork.title}
            </h1>

            <Link
              href={`/artist/${artist.username}`}
              className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-white hover:shadow-sm"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-sm font-semibold uppercase text-white">
                {artist.artistProfile?.avatar ? (
                  <img
                    src={
                      artist.artistProfile.avatar
                    }
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-950">
                  {displayName}
                </span>
                <span className="block truncate text-sm text-slate-500">
                  @{artist.username}
                </span>
              </span>
            </Link>

            {artwork.description && (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Description
                </h2>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {artwork.description}
                </p>
              </div>
            )}

            {artwork.tags.length > 0 && (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Tags
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {artwork.tags.map(
                    (tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                      >
                        <Hash size={12} />
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 text-sm">
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Eye size={15} />
                  Views
                </dt>

                <dd className="mt-2 font-bold text-slate-950">
                  {artwork.views}
                </dd>
              </div>

              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <dt className="flex items-center gap-2 text-slate-500">
                  <CalendarDays size={15} />
                  Uploaded
                </dt>

                <dd className="mt-2 font-bold text-slate-950">
                  {formatDate(
                    artwork.createdAt
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <ArtworkDetailActions
                artworkId={artwork._id.toString()}
                title={artwork.title}
                initialLiked={!!existingLike}
                initialLikesCount={
                  artwork.likesCount || 0
                }
                initialSaved={!!existingSave}
              />
            </div>
          </aside>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CommentSection
          artworkId={artwork._id.toString()}
          initialComments={
            commentsWithReplies
          }
        />

        <aside className="self-start rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Artwork pulse
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Quick stats
          </h2>

          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span className="text-slate-500">
                Likes
              </span>
              <span className="font-bold text-slate-950">
                {artwork.likesCount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span className="text-slate-500">
                Comments
              </span>
              <span className="font-bold text-slate-950">
                {totalCommentCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span className="text-slate-500">
                Views
              </span>
              <span className="font-bold text-slate-950">
                {artwork.views}
              </span>
            </div>
          </div>

          <Link
            href={`/artist/${artist.username}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            View artist profile
          </Link>
        </aside>
      </div>
    </section>
  );
}
