"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bookmark,
  Check,
  Edit3,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";

type ArtworkItem = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  isLiked: boolean;
};

type CollectionManagerProps = {
  collection: {
    id: string;
    name: string;
    description: string;
    coverArtwork: string | null;
  };
  artworks: ArtworkItem[];
};

export default function CollectionManager({
  collection,
  artworks,
}: CollectionManagerProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] =
    useState(false);
  const [name, setName] = useState(
    collection.name
  );
  const [description, setDescription] =
    useState(collection.description);
  const [status, setStatus] = useState("");
  const [busyAction, setBusyAction] =
    useState("");

  async function request(
    action: string,
    input: RequestInfo,
    init?: RequestInit
  ) {
    setBusyAction(action);
    setStatus("");

    try {
      const response = await fetch(input, init);
      const data = await response.json().catch(
        () => ({})
      );

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      router.refresh();
      return true;
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
      return false;
    } finally {
      setBusyAction("");
    }
  }

  async function saveDetails() {
    const ok = await request(
      "details",
      `/api/collections/${collection.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      }
    );

    if (ok) {
      setIsEditing(false);
    }
  }

  async function setCover(artworkId: string) {
    await request(
      `cover:${artworkId}`,
      `/api/collections/${collection.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverArtwork: artworkId,
        }),
      }
    );
  }

  async function removeArtwork(artworkId: string) {
    if (
      !window.confirm(
        "Remove this image from the collection?"
      )
    ) {
      return;
    }

    await request(
      `remove:${artworkId}`,
      `/api/collections/${collection.id}/artworks?artworkId=${artworkId}&keepSaved=true`,
      {
        method: "DELETE",
      }
    );
  }

  async function clearCollection() {
    if (
      !window.confirm(
        "Remove all images from this collection?"
      )
    ) {
      return;
    }

    await request(
      "clear",
      `/api/collections/${collection.id}/artworks?clear=all&keepSaved=true`,
      {
        method: "DELETE",
      }
    );
  }

  async function deleteCollection() {
    if (
      !window.confirm(
        "Delete this collection? The images will stay saved outside collections."
      )
    ) {
      return;
    }

    const ok = await request(
      "delete",
      `/api/collections/${collection.id}`,
      {
        method: "DELETE",
      }
    );

    if (ok) {
      router.push("/saved");
    }
  }

  const isBusy = Boolean(busyAction);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                Manage board
              </span>
              {status && (
                <span className="text-sm font-medium text-rose-600">
                  {status}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="grid gap-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Collection name
                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    maxLength={60}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Description
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    maxLength={240}
                    rows={3}
                    className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold">
                  {name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {description ||
                    "A focused board for saved artwork."}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={saveDetails}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyAction === "details" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(collection.name);
                    setDescription(
                      collection.description
                    );
                    setIsEditing(false);
                  }}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
              >
                <Edit3 className="h-4 w-4" />
                Rename
              </button>
            )}

            <button
              type="button"
              onClick={clearCollection}
              disabled={isBusy || artworks.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "clear" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Clear images
            </button>

            <button
              type="button"
              onClick={deleteCollection}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>

      {artworks.length > 0 ? (
        <div className="columns-2 gap-5 sm:columns-3 lg:columns-4 xl:columns-5">
          {artworks.map((artwork) => {
            const isCover =
              collection.coverArtwork === artwork.id;

            return (
              <article
                key={artwork.id}
                className="group mb-5 break-inside-avoid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
              >
                <Link
                  href={`/artwork/${artwork.id}`}
                  className="block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      sizes="(min-width: 1536px) 240px, (min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      unoptimized
                    />
                    {isCover && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-cyan-700 shadow-sm">
                        <Check className="h-3.5 w-3.5" />
                        Cover
                      </span>
                    )}
                  </div>
                </Link>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-950">
                        {artwork.title}
                      </h3>
                      <p className="mt-1 truncate text-sm font-medium text-slate-500">
                        {artwork.category}
                      </p>
                    </div>

                    {artwork.isLiked && (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                        liked
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
                    <span>{artwork.likesCount} likes</span>
                    <Bookmark className="h-4 w-4 text-cyan-700" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCover(artwork.id)
                      }
                      disabled={isBusy || isCover}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {busyAction ===
                      `cover:${artwork.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      Cover
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        removeArtwork(artwork.id)
                      }
                      disabled={isBusy}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction ===
                      `remove:${artwork.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
