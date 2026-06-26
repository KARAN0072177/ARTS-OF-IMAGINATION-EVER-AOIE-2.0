"use client";

import {
  Maximize2,
  Loader2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ArtworkQuickView from "@/components/artwork/ArtworkQuickView";

export interface GalleryArtwork {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  artistUsername?: string;
  artistName?: string;
  artistAvatar?: string;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

interface GalleryFeedProps {
  initialArtworks: GalleryArtwork[];
  category?: string;
  initialPage: number;
  totalCount: number;
  totalPages: number;
}

function GalleryTile({
  artwork,
  onOpen,
  priority = false,
}: {
  artwork: GalleryArtwork;
  onOpen: () => void;
  priority?: boolean;
}) {
  const [loaded, setLoaded] =
    useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, []);

  return (
    <article className="group mb-4 break-inside-avoid overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-slate-300 sm:mb-5">
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2"
        aria-label={`Open quick view for ${artwork.title}`}
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-200" />
        )}

        <img
          ref={imgRef}
          src={artwork.imageUrl}
          alt={artwork.title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-auto w-full transition duration-300 group-hover:scale-[1.02] ${
            loaded
              ? "opacity-100"
              : "opacity-0"
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-0 transition duration-200 group-hover:opacity-100" />

        <span className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-sm transition duration-200 group-hover:opacity-100">
          <Maximize2 size={17} />
        </span>
      </button>
    </article>
  );
}

function GallerySkeleton() {
  return (
    <>
      {[180, 260, 220, 320, 200, 280].map(
        (height, index) => (
          <div
            key={`${height}-${index}`}
            className="mb-4 break-inside-avoid animate-pulse rounded-xl bg-slate-200 sm:mb-5"
            style={{
              height,
            }}
          />
        )
      )}
    </>
  );
}

export default function GalleryFeed({
  initialArtworks,
  category = "",
  initialPage,
  totalCount,
  totalPages,
}: GalleryFeedProps) {
  const [artworks, setArtworks] =
    useState(initialArtworks);
  const [page, setPage] =
    useState(initialPage);
  const [loading, setLoading] =
    useState(false);
  const [openIndex, setOpenIndex] =
    useState<number | null>(null);
  const sentinelRef =
    useRef<HTMLDivElement | null>(null);

  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);

    try {
      const params =
        new URLSearchParams({
          page: String(page + 1),
          limit: "24",
        });

      if (category) {
        params.set("category", category);
      }

      const response = await fetch(
        `/api/artworks?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load artworks"
        );
      }

      setArtworks((current) => [
        ...current,
        ...data.artworks,
      ]);
      setPage(data.pagination.page);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [category, hasMore, loading, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMore();
          }
        },
        {
          rootMargin: "900px 0px",
        }
      );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const updateArtwork = (
    id: string,
    changes: Partial<GalleryArtwork>
  ) => {
    setArtworks((current) =>
      current.map((artwork) =>
        artwork.id === id
          ? {
              ...artwork,
              ...changes,
            }
          : artwork
      )
    );
  };

  const openArtwork =
    openIndex !== null
      ? artworks[openIndex]
      : null;
  const activeIndex = openIndex ?? -1;

  return (
    <>
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          Showing {artworks.length} of{" "}
          {totalCount}
        </span>

        {hasMore && (
          <span>
            Loading more as you scroll
          </span>
        )}
      </div>

      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
        {artworks.map((artwork, index) => (
          <GalleryTile
            key={artwork.id}
            artwork={artwork}
            onOpen={() => setOpenIndex(index)}
            priority={index < 8}
          />
        ))}

        {loading && <GallerySkeleton />}
      </div>

      <div
        ref={sentinelRef}
        className="flex min-h-12 items-center justify-center"
      >
        {loading && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Loader2
              size={16}
              className="animate-spin"
            />
            Loading more
          </span>
        )}

        {!hasMore && artworks.length > 0 && (
          <span className="text-sm font-medium text-slate-400">
            You are all caught up
          </span>
        )}
      </div>

      {openArtwork && (
        <ArtworkQuickView
          key={openArtwork.id}
          artwork={openArtwork}
          hasPrevious={activeIndex > 0}
          hasNext={
            activeIndex < artworks.length - 1
          }
          onPrevious={() =>
            setOpenIndex((current) =>
              current !== null
                ? Math.max(0, current - 1)
                : current
            )
          }
          onNext={() =>
            setOpenIndex((current) =>
              current !== null
                ? Math.min(
                    artworks.length - 1,
                    current + 1
                  )
                : current
            )
          }
          onLikeChange={(
            nextLiked,
            nextCount,
            artworkId = openArtwork.id
          ) => {
            updateArtwork(artworkId, {
              isLiked: nextLiked,
              likesCount: nextCount,
            });
          }}
          onSaveChange={(
            nextSaved,
            artworkId = openArtwork.id
          ) => {
            updateArtwork(artworkId, {
              isSaved: nextSaved,
            });
          }}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
