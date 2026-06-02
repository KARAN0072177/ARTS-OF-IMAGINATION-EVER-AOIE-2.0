"use client";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Heart,
  Share2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CollectionPicker from "@/components/artwork/CollectionPicker";

interface Recommendation {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
}

interface ArtworkQuickViewProps {
  artwork: {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    artistName?: string;
    artistUsername?: string;
    likesCount: number;
    isLiked: boolean;
    isSaved: boolean;
  };
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onLikeChange: (liked: boolean, count: number) => void;
  onSaveChange?: (saved: boolean) => void;
  onClose: () => void;
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
            artworkId: artwork.id,
          }),
        });

        const response = await fetch(
          `/api/recommendations?artworkId=${artwork.id}`
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
  }, [artwork.id]);

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
    onLikeChange(nextLiked, nextCount);

    try {
      const response = await fetch(
        `/api/artworks/${artwork.id}/like`,
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
        data.likesCount
      );
    } catch {
      setLiked(previousLiked);
      setLikesCount(previousCount);
      onLikeChange(
        previousLiked,
        previousCount
      );
    } finally {
      setIsSavingLike(false);
    }
  };

  const handleShare = async () => {
    const artworkPath = `/artwork/${artwork.id}`;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${artworkPath}`
        : artworkPath;

    try {
      if (navigator.share) {
        await navigator.share({
          title: artwork.title,
          text: `Check out "${artwork.title}" on AOIE 2.0`,
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(
        shareUrl
      );
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
    const safeTitle = artwork.title
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
      const response = await fetch(
        artwork.imageUrl
      );

      if (!response.ok) {
        throw new Error(
          "Unable to download image"
        );
      }

      const blob = await response.blob();
      const objectUrl =
        URL.createObjectURL(blob);
      const link =
        document.createElement("a");

      link.href = objectUrl;
      link.download = getDownloadFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      window.open(
        artwork.imageUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setIsDownloading(false);
    }
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
              src={artwork.imageUrl}
              alt={artwork.title}
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
                  {artwork.category}
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
                  {artwork.title}
                </h2>

                <div className="mt-4 flex items-stretch gap-2">
                  {artwork.artistUsername && (
                    <Link
                      href={`/artist/${artwork.artistUsername}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        <User size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">
                          {artwork.artistName ||
                            artwork.artistUsername}
                        </span>
                        <span className="block text-xs font-medium text-slate-500">
                          @{artwork.artistUsername}
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
                  href={`/artwork/${artwork.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open
                  <ExternalLink size={16} />
                </Link>
              </div>

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
                        <Link
                          key={item.id}
                          href={`/artwork/${item.id}`}
                          className="group mb-3 block break-inside-avoid overflow-hidden rounded-lg bg-slate-100 transition hover:shadow-md"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
                          />
                        </Link>
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
          artworkId={artwork.id}
          onClose={() =>
            setCollectionPickerOpen(false)
          }
          onSavedChange={(nextSaved) => {
            setSaved(nextSaved);
            onSaveChange?.(nextSaved);
          }}
        />
      )}
    </div>
  );
}
