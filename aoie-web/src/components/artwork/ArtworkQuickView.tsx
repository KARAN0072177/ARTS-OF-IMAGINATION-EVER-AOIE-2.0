"use client";

import {
  Download,
  ExternalLink,
  Heart,
  Loader2,
  Share2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  };
  onLikeChange: (liked: boolean, count: number) => void;
  onClose: () => void;
}

export default function ArtworkQuickView({
  artwork,
  onLikeChange,
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
  const [isSavingLike, setIsSavingLike] =
    useState(false);
  const [shareStatus, setShareStatus] =
    useState<"idle" | "copied">("idle");
  const [isDownloading, setIsDownloading] =
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
  }, [onClose]);

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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 px-3 py-4 sm:px-5 sm:py-6"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">
              {artwork.title}
            </h2>
            {artwork.artistUsername && (
              <p className="mt-1 truncate text-sm text-slate-500">
                by{" "}
                <span className="font-semibold text-slate-800">
                  {artwork.artistName ||
                    artwork.artistUsername}
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-h-[320px] items-center justify-center bg-slate-950 sm:min-h-[440px]">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              decoding="async"
              className="max-h-[78vh] w-full object-contain"
            />
          </div>

          <aside className="border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
            <div className="flex h-full flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {artwork.category}
                </span>
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

              {artwork.artistUsername && (
                <Link
                  href={`/artist/${artwork.artistUsername}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
                    <User size={16} />
                  </span>
                  <span className="min-w-0 truncate">
                    {artwork.artistName ||
                      artwork.artistUsername}
                  </span>
                </Link>
              )}
            </div>
          </aside>
        </div>

        <div className="space-y-6 p-5">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-950">
                Recommended images
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-10 text-slate-500">
                <Loader2
                  size={18}
                  className="mr-2 animate-spin"
                />
                Loading recommendations...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                No recommended images yet.
              </div>
            ) : (
              <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
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
      </div>
    </div>
  );
}
