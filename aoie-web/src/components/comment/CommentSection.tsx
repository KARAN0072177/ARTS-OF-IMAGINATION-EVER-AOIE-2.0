"use client";

import {
  Heart,
  MessageCircle,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface CommentUser {
  _id: string;
  username: string;
  role?: string;
  artistProfile?: {
    displayName?: string;
  };
}

export interface ArtworkComment {
  _id: string;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  parentComment?: string | null;
  user: CommentUser;
  replies?: ArtworkComment[];
}

interface CommentSectionProps {
  artworkId: string;
  initialComments: ArtworkComment[];
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getDisplayName(user: CommentUser) {
  return (
    user.artistProfile?.displayName ||
    user.username
  );
}

function getTotalCommentCount(
  comments: ArtworkComment[]
) {
  return comments.reduce(
    (total, comment) =>
      total +
      1 +
      (comment.replies?.length || 0),
    0
  );
}

function normalizeComments(
  comments: ArtworkComment[]
): ArtworkComment[] {
  return comments.map((comment) => ({
    ...comment,
    likesCount: comment.likesCount || 0,
    isLiked: Boolean(comment.isLiked),
    replies: normalizeComments(
      comment.replies || []
    ),
  }));
}

export default function CommentSection({
  artworkId,
  initialComments,
}: CommentSectionProps) {
  const router = useRouter();

  const [comments, setComments] =
    useState(() =>
      normalizeComments(initialComments)
    );
  const [content, setContent] =
    useState("");
  const [replyContent, setReplyContent] =
    useState("");
  const [activeReplyId, setActiveReplyId] =
    useState<string | null>(null);
  const [submittingTarget, setSubmittingTarget] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  const totalCommentCount =
    getTotalCommentCount(comments);

  function updateCommentLikeState(
    commentId: string,
    liked: boolean,
    likesCount: number
  ) {
    setComments((currentComments) =>
      currentComments.map((comment) => {
        if (comment._id === commentId) {
          return {
            ...comment,
            isLiked: liked,
            likesCount,
          };
        }

        return {
          ...comment,
          replies:
            comment.replies?.map((reply) =>
              reply._id === commentId
                ? {
                    ...reply,
                    isLiked: liked,
                    likesCount,
                  }
                : reply
            ) || [],
        };
      })
    );
  }

  async function handleLikeComment(
    comment: ArtworkComment
  ) {
    const previousLiked =
      comment.isLiked;
    const previousLikesCount =
      comment.likesCount;
    const nextLiked = !previousLiked;
    const nextLikesCount =
      previousLiked
        ? Math.max(
            0,
            previousLikesCount - 1
          )
        : previousLikesCount + 1;

    updateCommentLikeState(
      comment._id,
      nextLiked,
      nextLikesCount
    );

    try {
      const response = await fetch(
        `/api/comments/${comment._id}/like`,
        {
          method: "POST",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update like"
        );
      }

      updateCommentLikeState(
        comment._id,
        data.liked,
        data.likesCount
      );
    } catch {
      updateCommentLikeState(
        comment._id,
        previousLiked,
        previousLikesCount
      );
    }
  }

  async function submitComment(
    text: string,
    parentCommentId?: string
  ) {
    const trimmedContent = text.trim();

    if (!trimmedContent) {
      return;
    }

    setError("");
    setSubmittingTarget(
      parentCommentId || "comment"
    );

    try {
      const response = await fetch(
        `/api/artworks/${artworkId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmedContent,
            parentCommentId,
          }),
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to post comment"
        );
      }

      const newComment =
        data.comment as ArtworkComment;

      if (parentCommentId) {
        setComments((currentComments) =>
          currentComments.map((comment) =>
            comment._id === parentCommentId
              ? {
                  ...comment,
                  replies: [
                    ...(comment.replies || []),
                    newComment,
                  ],
                }
              : comment
          )
        );

        setReplyContent("");
        setActiveReplyId(null);
        return;
      }

      setComments((currentComments) => [
        {
          ...newComment,
          replies: [],
        },
        ...currentComments,
      ]);
      setContent("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to post comment"
      );
    } finally {
      setSubmittingTarget(null);
    }
  }

  function handleCommentSubmit(
    event: FormEvent
  ) {
    event.preventDefault();
    submitComment(content);
  }

  function handleReplySubmit(
    event: FormEvent,
    commentId: string
  ) {
    event.preventDefault();
    submitComment(replyContent, commentId);
  }

  return (
    <section className="lg:col-span-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Comments
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Share feedback or reply to other viewers.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
            <MessageCircle size={16} />
            {totalCommentCount}
          </div>
        </div>

        <form
          onSubmit={handleCommentSubmit}
          className="mt-5"
        >
          <textarea
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
            placeholder="Write a thoughtful comment..."
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-950 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {content.length}/1000
            </p>

            <button
              type="submit"
              disabled={
                !content.trim() ||
                submittingTarget === "comment"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />
              {submittingTarget === "comment"
                ? "Posting..."
                : "Post"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-800">
                No comments yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Start the conversation for this artwork.
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <article
                key={comment._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <CommentBody
                  comment={comment}
                  onLike={() =>
                    handleLikeComment(comment)
                  }
                  onReply={() => {
                    setActiveReplyId(
                      activeReplyId === comment._id
                        ? null
                        : comment._id
                    );
                    setReplyContent("");
                  }}
                />

                {comment.replies &&
                  comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 border-l border-slate-200 pl-4">
                      {comment.replies.map(
                        (reply) => (
                          <CommentBody
                            key={reply._id}
                            comment={reply}
                            compact
                            onLike={() =>
                              handleLikeComment(
                                reply
                              )
                            }
                            onReply={() => {
                              setActiveReplyId(
                                comment._id
                              );
                              setReplyContent(
                                `@${reply.user.username} `
                              );
                            }}
                          />
                        )
                      )}
                    </div>
                  )}

                {activeReplyId ===
                  comment._id && (
                  <form
                    onSubmit={(event) =>
                      handleReplySubmit(
                        event,
                        comment._id
                      )
                    }
                    className="mt-4 rounded-2xl bg-slate-50 p-3"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(event) =>
                        setReplyContent(
                          event.target.value
                        )
                      }
                      autoFocus
                      placeholder={`Reply to @${comment.user.username}...`}
                      rows={2}
                      maxLength={1000}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                    />

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(null);
                          setReplyContent("");
                        }}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          !replyContent.trim() ||
                          submittingTarget ===
                            comment._id
                        }
                        className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingTarget ===
                        comment._id
                          ? "Replying..."
                          : "Reply"}
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function CommentBody({
  comment,
  compact = false,
  onReply,
  onLike,
}: {
  comment: ArtworkComment;
  compact?: boolean;
  onReply: () => void;
  onLike: () => void;
}) {
  const likesCount =
    comment.likesCount || 0;

  return (
    <div className="flex gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-slate-950 font-semibold text-white ${
          compact
            ? "h-8 w-8 text-xs"
            : "h-10 w-10 text-sm"
        }`}
      >
        {comment.user.username
          .slice(0, 1)
          .toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold text-slate-950">
            {getDisplayName(comment.user)}
          </p>
          <p className="text-sm text-slate-500">
            @{comment.user.username}
          </p>
          <span className="text-slate-300">
            /
          </span>
          <p className="text-sm text-slate-500">
            {formatTime(comment.createdAt)}
          </p>
        </div>

        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {comment.content}
        </p>

        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={onLike}
            aria-pressed={comment.isLiked}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-rose-600"
          >
            <Heart
              size={15}
              className={
                comment.isLiked
                  ? "fill-rose-500 text-rose-500"
                  : ""
              }
            />
            {likesCount > 0 && (
              <span>
                {likesCount}{" "}
                {likesCount === 1
                  ? "like"
                  : "likes"}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onReply}
            className="text-sm font-semibold text-slate-500 transition hover:text-cyan-700"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
