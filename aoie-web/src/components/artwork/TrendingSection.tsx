"use client";

import { Flame, Maximize2 } from "lucide-react";
import { useState } from "react";

import ArtworkQuickView from "@/components/artwork/ArtworkQuickView";

interface TrendingArtwork {
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

interface TrendingSectionProps {
  artworks: TrendingArtwork[];
}

export default function TrendingSection({
  artworks,
}: TrendingSectionProps) {
  const [openIndex, setOpenIndex] =
    useState<number | null>(null);
  const [items, setItems] =
    useState(artworks);

  if (items.length === 0) {
    return null;
  }

  const activeArtwork =
    openIndex !== null
      ? items[openIndex]
      : null;
  const marqueeItems = [...items, ...items];

  const updateArtwork = (
    id: string,
    changes: Partial<TrendingArtwork>
  ) => {
    setItems((current) =>
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

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Flame
                  size={17}
                  className="fill-rose-500"
                />
              </span>
              <h2 className="text-lg font-semibold text-slate-950">
                Trending This Week
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Fast-rising artwork from
              recent activity.
            </p>
          </div>

        </div>

        <div className="relative overflow-hidden">
          <style>
            {`
              @keyframes aoie-trending-marquee {
                from { transform: translate3d(0, 0, 0); }
                to { transform: translate3d(-50%, 0, 0); }
              }
            `}
          </style>
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />

        <div
          className="flex w-max gap-3 pb-2 will-change-transform"
          style={{
            animation:
              "aoie-trending-marquee 36s linear infinite",
            backfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          {marqueeItems.map((artwork, index) => (
            <button
              key={`${artwork.id}-${index}`}
              type="button"
              onClick={() =>
                setOpenIndex(index % items.length)
              }
              className="group relative h-[240px] w-[180px] shrink-0 overflow-hidden rounded-xl bg-slate-100 text-left shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2"
              aria-label={`Open ${artwork.title}`}
            >
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                loading={index < 6 ? "eager" : "lazy"}
                fetchPriority={index < 6 ? "high" : "auto"}
                decoding="async"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent opacity-90" />

              <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <Maximize2 size={15} />
              </span>

              <div className="absolute inset-x-0 bottom-0 p-3">
                <span className="mb-2 inline-flex rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                  {artwork.category}
                </span>
                <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                  {artwork.title}
                </h3>
                {artwork.artistName && (
                  <p className="mt-1 truncate text-xs font-medium text-white/75">
                    {artwork.artistName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
        </div>
      </section>

      {activeArtwork && (
        <ArtworkQuickView
          artwork={activeArtwork}
          hasPrevious={openIndex! > 0}
          hasNext={
            openIndex! < items.length - 1
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
                    items.length - 1,
                    current + 1
                  )
                : current
            )
          }
          onLikeChange={(
            nextLiked,
            nextCount,
            artworkId = activeArtwork.id
          ) => {
            updateArtwork(artworkId, {
              isLiked: nextLiked,
              likesCount: nextCount,
            });
          }}
          onSaveChange={(
            nextSaved,
            artworkId = activeArtwork.id
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
