"use client";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Heart,
  MessageCircle,
  Send,
  Share2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import CollectionPicker from "@/components/artwork/CollectionPicker";
import ReportArtworkButton from "@/components/artwork/ReportArtworkButton";

interface Recommendation {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  artistName?: string;
  artistUsername?: string;
  artistAvatar?: string;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

type QuickViewArtwork = Recommendation;

interface ArtworkQuickViewProps {
  artwork: QuickViewArtwork;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onLikeChange: (
    liked: boolean,
    count: number,
    artworkId?: string
  ) => void;
  onSaveChange?: (
    saved: boolean,
    artworkId?: string
  ) => void;
  onClose: () => void;
}

interface QuickCommentUser {
  _id?: string;
  username?: string;
  artistProfile?: {
    displayName?: string;
  };
}

interface QuickComment {
  _id: string;
  content: string;
  createdAt: string;
  user?: QuickCommentUser;
  replies?: QuickComment[];
}

function getCommentCount(
  comments: QuickComment[]
) {
  return comments.reduce(
    (total, comment) =>
      total +
      1 +
      (comment.replies?.length || 0),
    0
  );
}

function getCommentUserName(
  user?: QuickCommentUser
) {
  return (
    user?.artistProfile?.displayName ||
    user?.username ||
    "AOIE user"
  );
}

function getFlattenedPreviewComments(
  comments: QuickComment[]
) {
  return comments.flatMap((comment) => [
    comment,
    ...(comment.replies || []),
  ]);
}

export default function ArtworkQuickView({
  artwork,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  onLikeChange,
  onSaveChange,
  onClose,
}: ArtworkQuickViewProps) {
  const router = useRouter();

  const [recommendations, setRecommendations] =
    useState<Recommendation[]>([]);
  const [activeArtwork, setActiveArtwork] =
    useState<QuickViewArtwork>(artwork);
  const [loading, setLoading] =
    useState(true);
  const [liked, setLiked] = useState(
    artwork.isLiked
  );
  const [likesCount, setLikesCount] =
    useState(artwork.likesCount);
  const [saved, setSaved] = useState(
    artwork.isSaved
  );
  const [isSavingLike, setIsSavingLike] =
    useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] =
    useState(false);
  const [shareStatus, setShareStatus] =
    useState<"idle" | "copied">("idle");
  const [isDownloading, setIsDownloading] =
    useState(false);
  const [imageLoaded, setImageLoaded] =
    useState(false);
  const [comments, setComments] =
    useState<QuickComment[]>([]);
  const [commentsLoading, setCommentsLoading] =
    useState(false);
  const [commentsExpanded, setCommentsExpanded] =
    useState(false);
  const [commentText, setCommentText] =
    useState("");
  const [commentError, setCommentError] =
    useState("");
  const [isPostingComment, setIsPostingComment] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      try {
        await fetch("/api/interactions", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            artworkId: activeArtwork.id,
          }),
        });

        const response = await fetch(
          `/api/recommendations?artworkId=${activeArtwork.id}`
        );
        const data = await response.json();

        if (data.success && isMounted) {
          setRecommendations(
            data.recommendations
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [activeArtwork.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setCommentsLoading(true);
      setCommentError("");

      try {
        const response = await fetch(
          `/api/artworks/${activeArtwork.id}/comments`
        );
        const data = await response.json();

        if (
          response.ok &&
          data.success &&
          isMounted
        ) {
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setCommentError(
            "Could not load comments."
          );
        }
      } finally {
        if (isMounted) {
          setCommentsLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [activeArtwork.id]);

  const totalCommentCount =
    getCommentCount(comments);
  const previewComments =
    getFlattenedPreviewComments(comments);
  const visibleComments = commentsExpanded
    ? previewComments
    : previewComments.slice(0, 2);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (
        event.key === "ArrowLeft" &&
        hasPrevious
      ) {
        onPrevious?.();
      }

      if (
        event.key === "ArrowRight" &&
        hasNext
      ) {
        onNext?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    hasNext,
    hasPrevious,
    onClose,
    onNext,
    onPrevious,
  ]);

  const handleLike = async () => {
    if (isSavingLike) {
      return;
    }

    const previousLiked = liked;
    const previousCount = likesCount;
    const nextLiked = !previousLiked;
    const nextCount = previousLiked
      ? Math.max(0, previousCount - 1)
      : previousCount + 1;

    setIsSavingLike(true);
    setLiked(nextLiked);
    setLikesCount(nextCount);
    onLikeChange(
      nextLiked,
      nextCount,
      activeArtwork.id
    );

    try {
      const response = await fetch(
        `/api/artworks/${activeArtwork.id}/like`,
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

      setLiked(data.liked);
      setLikesCount(data.likesCount);
      onLikeChange(
        data.liked,
        data.likesCount,
        activeArtwork.id
      );
    } catch {
      setLiked(previousLiked);
      setLikesCount(previousCount);
      onLikeChange(
        previousLiked,
        previousCount,
        activeArtwork.id
      );
    } finally {
      setIsSavingLike(false);
    }
  };

  const recordInteraction = async (
    type: "share" | "download"
  ) => {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          artworkId: activeArtwork.id,
          type,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    const artworkPath = `/artwork/${activeArtwork.id}`;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${artworkPath}`
        : artworkPath;

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeArtwork.title,
          text: `Check out "${activeArtwork.title}" on AOIE 2.0`,
          url: shareUrl,
        });
        await recordInteraction("share");

        return;
      }

      await navigator.clipboard.writeText(
        shareUrl
      );
      await recordInteraction("share");
      setShareStatus("copied");

      window.setTimeout(() => {
        setShareStatus("idle");
      }, 1800);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(error);
    }
  };

  const getDownloadFileName = () => {
    const safeTitle = activeArtwork.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `${safeTitle || "aoie-artwork"}.jpg`;
  };

  const handleDownload = async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const link =
        document.createElement("a");

      link.href = `/api/artworks/${activeArtwork.id}/download`;
      link.download = getDownloadFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      window.open(
        `/api/artworks/${activeArtwork.id}/download`,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCommentSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    const trimmed = commentText.trim();

    if (!trimmed || isPostingComment) {
      return;
    }

    setIsPostingComment(true);
    setCommentError("");

    try {
      const response = await fetch(
        `/api/artworks/${activeArtwork.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            content: trimmed,
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
            "Could not post comment."
        );
      }

      setComments((currentComments) => [
        {
          ...data.comment,
          replies: [],
        },
        ...currentComments,
      ]);
      setCommentText("");
      setCommentsExpanded(true);
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "Could not post comment."
      );
    } finally {
      setIsPostingComment(false);
    }
  };

  const openRecommendation = (
    item: Recommendation
  ) => {
    setLoading(true);
    setRecommendations([]);
    setActiveArtwork(item);
    setLiked(item.isLiked);
    setLikesCount(item.likesCount);
    setSaved(item.isSaved);
    setImageLoaded(false);
    setShareStatus("idle");
    setComments([]);
    setCommentText("");
    setCommentError("");
    setCommentsExpanded(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95"
      onClick={onClose}
    >
      <div
        className="flex h-full flex-col"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex h-14 shrink-0 items-center justify-end px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative flex min-h-[42vh] items-center justify-center px-3 pb-3 lg:min-h-0 lg:px-6 lg:pb-8">
            {hasPrevious && (
              <button
                type="button"
                onClick={onPrevious}
                aria-label="Previous artwork"
                className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white lg:inline-flex"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="Next artwork"
                className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white lg:inline-flex"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {!imageLoaded && (
              <div className="absolute inset-3 animate-pulse rounded-lg bg-white/10 lg:inset-x-6 lg:bottom-8 lg:top-0" />
            )}

            <img
              src={activeArtwork.imageUrl}
              alt={activeArtwork.title}
              decoding="async"
              onLoad={() =>
                setImageLoaded(true)
              }
              className={`max-h-full max-w-full rounded-lg object-contain shadow-2xl transition duration-200 ${
                imageLoaded
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />
          </div>

          <aside className="min-h-0 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl lg:rounded-l-2xl lg:rounded-t-none lg:p-6">
            <div className="space-y-5">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {activeArtwork.category}
                </span>
                  {likesCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                      <Heart
                        size={15}
                        className={
                          liked
                            ? "fill-rose-500 text-rose-500"
                            : "text-rose-500"
                        }
                      />
                      {likesCount}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-semibold leading-tight text-slate-950">
                  {activeArtwork.title}
                </h2>

                <div className="mt-4 flex items-stretch gap-2">
                  {activeArtwork.artistUsername && (
                    <Link
                      href={`/artist/${activeArtwork.artistUsername}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        {activeArtwork.artistAvatar ? (
                          <img
                            src={
                              activeArtwork.artistAvatar
                            }
                            alt={
                              activeArtwork.artistName ||
                              activeArtwork.artistUsername
                            }
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <User size={16} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">
                          {activeArtwork.artistName ||
                            activeArtwork.artistUsername}
                        </span>
                        <span className="block text-xs font-medium text-slate-500">
                          @{activeArtwork.artistUsername}
                        </span>
                      </span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCollectionPickerOpen(true)
                    }
                    aria-pressed={saved}
                    aria-label="Save to collection"
                    className={`inline-flex w-14 shrink-0 items-center justify-center rounded-lg border text-slate-700 transition ${
                      saved
                        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <Bookmark
                      size={19}
                      className={
                        saved
                          ? "fill-cyan-600"
                          : ""
                      }
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={isSavingLike}
                    aria-pressed={liked}
                    className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      liked
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "bg-slate-950 text-white hover:bg-slate-800"
                    }`}
                  >
                    <Heart
                      size={17}
                      className={
                        liked
                          ? "fill-rose-500 text-rose-500"
                          : ""
                      }
                    />
                    {liked ? "Liked" : "Like"}
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Share2 size={16} />
                    {shareStatus === "copied"
                      ? "Copied"
                      : "Share"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download size={16} />
                    {isDownloading
                      ? "Downloading"
                      : "Download"}
                  </button>

                  <Link
                    href={`/artwork/${activeArtwork.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Full page
                    <ExternalLink size={16} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCommentsExpanded(true)
                    }
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                  >
                    <MessageCircle size={16} />
                    {totalCommentCount > 0
                      ? `${totalCommentCount} comment${totalCommentCount === 1 ? "" : "s"}`
                      : "Comment"}
                  </button>

                  <div className="[&>button]:w-full">
                    <ReportArtworkButton
                      artworkId={activeArtwork.id}
                      variant="menu"
                    />
                  </div>
                </div>
              </div>

              <section className="border-t border-slate-200 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Comments
                    </h3>
                    <p className="text-xs text-slate-500">
                      Join the conversation without leaving the image.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    <MessageCircle size={13} />
                    {totalCommentCount}
                  </span>
                </div>

                <form
                  onSubmit={handleCommentSubmit}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2"
                >
                  <textarea
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(
                        event.target.value
                      )
                    }
                    rows={2}
                    maxLength={1000}
                    placeholder="Add a comment..."
                    className="w-full resize-none rounded-lg border border-transparent bg-white p-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-slate-400">
                      {commentText.length}/1000
                    </span>
                    <button
                      type="submit"
                      disabled={
                        !commentText.trim() ||
                        isPostingComment
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={14} />
                      {isPostingComment
                        ? "Posting"
                        : "Post"}
                    </button>
                  </div>
                </form>

                {commentError && (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {commentError}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {commentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((item) => (
                        <div
                          key={item}
                          className="h-14 animate-pulse rounded-xl bg-slate-100"
                        />
                      ))}
                    </div>
                  ) : visibleComments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        No comments yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Be the first to say something.
                      </p>
                    </div>
                  ) : (
                    visibleComments.map((comment) => (
                      <div
                        key={comment._id}
                        className="rounded-xl bg-slate-50 p-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                            {getCommentUserName(
                              comment.user
                            )
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {getCommentUserName(
                                comment.user
                              )}
                            </p>
                            <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-slate-600">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {previewComments.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCommentsExpanded(
                        (current) => !current
                      )
                    }
                    className="mt-3 text-sm font-bold text-cyan-700 transition hover:text-cyan-900"
                  >
                    {commentsExpanded
                      ? "Show fewer comments"
                      : `View all ${previewComments.length} comments`}
                  </button>
                )}
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h3 className="mb-4 text-base font-semibold text-slate-950">
                  Recommended images
                </h3>

                {loading ? (
                  <div className="columns-2 gap-3">
                    {[
                      120, 190, 150, 230,
                    ].map((height, index) => (
                      <div
                        key={`${height}-${index}`}
                        className="mb-3 break-inside-avoid animate-pulse rounded-lg bg-slate-200"
                        style={{ height }}
                      />
                    ))}
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                    No recommended images yet.
                  </div>
                ) : (
                  <div className="columns-2 gap-3">
                    {recommendations.map(
                      (item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            openRecommendation(item)
                          }
                          className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-slate-100 text-left transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2"
                          aria-label={`Open ${item.title}`}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      </div>

      {collectionPickerOpen && (
        <CollectionPicker
          artworkId={activeArtwork.id}
          onClose={() =>
            setCollectionPickerOpen(false)
          }
          onSavedChange={(nextSaved) => {
            setSaved(nextSaved);
            onSaveChange?.(
              nextSaved,
              activeArtwork.id
            );
          }}
        />
      )}
    </div>
  );
}
