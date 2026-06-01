"use client";

import {
  ExternalLink,
  Heart,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
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
  };
  onClose: () => void;
}

export default function ArtworkQuickView({
  artwork,
  onClose,
}: ArtworkQuickViewProps) {
  const [recommendations, setRecommendations] =
    useState<Recommendation[]>([]);
  const [loading, setLoading] =
    useState(true);

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 px-4 py-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Quick view
            </p>
            <h2 className="truncate text-lg font-semibold text-slate-950">
              {artwork.title}
            </h2>
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

        <div className="bg-black">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            decoding="async"
            className="mx-auto max-h-[72vh] w-full object-contain"
          />
        </div>

        <div className="space-y-6 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {artwork.category}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                  <Heart
                    size={15}
                    className="text-rose-500"
                  />
                  {artwork.likesCount}
                </span>
              </div>

              {artwork.artistUsername && (
                <p className="mt-2 text-sm text-slate-500">
                  by{" "}
                  <span className="font-semibold text-slate-800">
                    {artwork.artistName ||
                      artwork.artistUsername}
                  </span>
                </p>
              )}
            </div>

            <Link
              href={`/artwork/${artwork.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open artwork
              <ExternalLink size={16} />
            </Link>
          </div>

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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recommendations.map(
                  (item) => (
                    <Link
                      key={item.id}
                      href={`/artwork/${item.id}`}
                      className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-md"
                    >
                      <div className="aspect-square overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="line-clamp-1 text-sm font-semibold text-slate-950">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.category}
                        </p>
                      </div>
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
