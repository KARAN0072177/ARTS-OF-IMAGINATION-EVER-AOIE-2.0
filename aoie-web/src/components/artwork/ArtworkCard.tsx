"use client";

import { useState } from "react";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ArtworkQuickView from "@/components/artwork/ArtworkQuickView";

interface ArtworkCardProps {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  artistUsername?: string;
  artistName?: string;
  createdAt?: string;
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
  createdAt,
  likesCount = 0,
  isLiked = false,
}: ArtworkCardProps) {
  const router = useRouter();

  const [liked, setLiked] =
    useState(isLiked);
  const [count, setCount] =
    useState(likesCount);
  const [isSaving, setIsSaving] =
    useState(false);
  const [quickViewOpen, setQuickViewOpen] =
    useState(false);

  const handleLike = async () => {
    if (isSaving) {
      return;
    }

    const previousLiked = liked;
    const previousCount = count;

    setIsSaving(true);
    setLiked(!previousLiked);
    setCount((currentCount) =>
      previousLiked
        ? Math.max(0, currentCount - 1)
        : currentCount + 1
    );

    try {
      const response = await fetch(
        `/api/artworks/${id}/like`,
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
      setCount(data.likesCount);
    } catch {
      setLiked(previousLiked);
      setCount(previousCount);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = createdAt
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
      }).format(new Date(createdAt))
    : "";

  return (
    <>
      <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
        <button
          type="button"
          onClick={() =>
            setQuickViewOpen(true)
          }
          className="block w-full text-left"
          aria-label={`Open quick view for ${title}`}
        >
          <div className="aspect-square overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
        </button>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
              {category}
            </span>

            {formattedDate && (
              <span className="text-xs font-medium text-slate-400">
                {formattedDate}
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/artwork/${id}`}
              className="min-w-0"
            >
              <h3 className="line-clamp-1 font-semibold text-slate-950 transition hover:text-cyan-700">
                {title}
              </h3>

              {artistUsername && (
                <p className="mt-1 truncate text-sm text-slate-500">
                  by{" "}
                  <span className="font-medium text-slate-700">
                    {artistName ||
                      artistUsername}
                  </span>
                </p>
              )}
            </Link>

            <button
              type="button"
              onClick={handleLike}
              disabled={isSaving}
              aria-label={
                liked
                  ? "Unlike artwork"
                  : "Like artwork"
              }
              aria-pressed={liked}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Heart
                size={16}
                className={
                  liked
                    ? "fill-rose-500 text-rose-500"
                    : ""
                }
              />
              <span>{count}</span>
            </button>
          </div>
        </div>
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
          }}
          onClose={() =>
            setQuickViewOpen(false)
          }
        />
      )}
    </>
  );
}
