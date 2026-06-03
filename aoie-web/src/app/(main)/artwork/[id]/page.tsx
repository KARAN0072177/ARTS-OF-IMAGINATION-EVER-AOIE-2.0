import Link from "next/link";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Comment from "@/models/Comment";
import CommentLike from "@/models/CommentLike";
import Save from "@/models/Save";

import CommentSection, {
  ArtworkComment,
} from "@/components/comment/CommentSection";

import SaveButton from "@/components/artwork/SaveButton";
import ReportArtworkButton from "@/components/artwork/ReportArtworkButton";

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
    <section className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="self-start overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="h-auto w-full object-contain"
          />
        </div>

        <aside className="self-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              {artwork.category}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {artwork.likesCount}{" "}
              {artwork.likesCount === 1
                ? "like"
                : "likes"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950">
            {artwork.title}
          </h1>

          <Link
            href={`/artist/${artist.username}`}
            className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:bg-slate-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold uppercase text-white">
              {displayName.charAt(0)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">
                {displayName}
              </span>
              <span className="block truncate text-sm text-slate-500">
                @{artist.username}
              </span>
            </span>
          </Link>

          {artwork.description && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Description
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {artwork.description}
              </p>
            </div>
          )}

          {artwork.tags.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tags
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
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

          <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Views
              </dt>

              <dd className="font-semibold text-slate-950">
                {artwork.views}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Uploaded
              </dt>

              <dd className="font-semibold text-slate-950">
                {formatDate(
                  artwork.createdAt
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <SaveButton
              artworkId={artwork._id.toString()}
              initialSaved={!!existingSave}
            />
          </div>

          <div className="mt-3">
            <ReportArtworkButton
              artworkId={artwork._id.toString()}
            />
          </div>
        </aside>
      </div>

      <div>
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
