import Link from "next/link";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Comment from "@/models/Comment";
import CommentLike from "@/models/CommentLike";

import CommentSection, {
  ArtworkComment,
} from "@/components/comment/CommentSection";

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

export default async function ArtworkPage({
  params,
}: ArtworkPageProps) {
  const { id } = await params;

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
          initialComments={
            commentsWithReplies
          }
        />
      </div>
    </section>
  );
}
