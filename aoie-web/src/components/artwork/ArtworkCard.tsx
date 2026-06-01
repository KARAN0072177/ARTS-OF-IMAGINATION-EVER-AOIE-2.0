"use client";

import { useState } from "react";

import { Maximize2 } from "lucide-react";

import ArtworkQuickView from "@/components/artwork/ArtworkQuickView";

interface ArtworkCardProps {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  artistUsername?: string;
  artistName?: string;
  likesCount?: number;
  isLiked?: boolean;
}

export default function ArtworkCard({
  id,
  title,
  imageUrl,
  category,
  artistUsername,
  artistName,
  likesCount = 0,
  isLiked = false,
}: ArtworkCardProps) {
  const [liked, setLiked] =
    useState(isLiked);
  const [count, setCount] =
    useState(likesCount);
  const [quickViewOpen, setQuickViewOpen] =
    useState(false);

  return (
    <>
      <article className="group mb-4 break-inside-avoid overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-slate-300 sm:mb-5">
        <button
          type="button"
          onClick={() =>
            setQuickViewOpen(true)
          }
          className="relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2"
          aria-label={`Open quick view for ${title}`}
        >
          <div className="overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-0 transition duration-200 group-hover:opacity-100" />

          <span className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-sm transition duration-200 group-hover:opacity-100">
            <Maximize2 size={17} />
          </span>
        </button>
      </article>

      {quickViewOpen && (
        <ArtworkQuickView
          artwork={{
            id,
            title,
            imageUrl,
            category,
            artistName,
            artistUsername,
            likesCount: count,
            isLiked: liked,
          }}
          onLikeChange={(
            nextLiked,
            nextCount
          ) => {
            setLiked(nextLiked);
            setCount(nextCount);
          }}
          onClose={() =>
            setQuickViewOpen(false)
          }
        />
      )}
    </>
  );
}
