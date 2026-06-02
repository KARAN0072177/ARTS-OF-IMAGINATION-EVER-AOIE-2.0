"use client";

import {
  Bookmark,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Collection {
  id: string;
  name: string;
  description: string;
  count: number;
  artworkIds: string[];
}

interface CollectionPickerProps {
  artworkId: string;
  onClose: () => void;
  onSavedChange: (saved: boolean) => void;
}

export default function CollectionPicker({
  artworkId,
  onClose,
  onSavedChange,
}: CollectionPickerProps) {
  const [collections, setCollections] =
    useState<Collection[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [savingId, setSavingId] =
    useState("");
  const [name, setName] =
    useState("");
  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCollections() {
      try {
        const response = await fetch(
          "/api/collections"
        );
        const data = await response.json();

        if (
          mounted &&
          data.success
        ) {
          setCollections(
            data.collections
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      mounted = false;
    };
  }, []);

  async function addToCollection(
    collectionId: string
  ) {
    try {
      setSavingId(collectionId);
      setError("");

      const response = await fetch(
        `/api/collections/${collectionId}/artworks`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            artworkId,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save artwork"
        );
      }

      setCollections((current) =>
        current.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                count: collection.artworkIds.includes(
                  artworkId
                )
                  ? collection.count
                  : collection.count + 1,
                artworkIds: Array.from(
                  new Set([
                    ...collection.artworkIds,
                    artworkId,
                  ])
                ),
              }
            : collection
        )
      );
      onSavedChange(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSavingId("");
    }
  }

  async function removeFromCollection(
    collectionId: string
  ) {
    try {
      setSavingId(collectionId);
      setError("");

      const response = await fetch(
        `/api/collections/${collectionId}/artworks?artworkId=${artworkId}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to remove artwork"
        );
      }

      let stillSaved = false;

      setCollections((current) => {
        const next = current.map(
          (collection) => {
            if (
              collection.id !== collectionId
            ) {
              if (
                collection.artworkIds.includes(
                  artworkId
                )
              ) {
                stillSaved = true;
              }

              return collection;
            }

            const nextArtworkIds =
              collection.artworkIds.filter(
                (id) => id !== artworkId
              );

            return {
              ...collection,
              count: nextArtworkIds.length,
              artworkIds: nextArtworkIds,
            };
          }
        );

        return next;
      });

      onSavedChange(
        typeof data.saved === "boolean"
          ? data.saved
          : stillSaved
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSavingId("");
    }
  }

  async function createCollection(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setError("");
      setSavingId("new");

      const response = await fetch(
        "/api/collections",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to create collection"
        );
      }

      setCollections((current) => [
        data.collection,
        ...current,
      ]);
      setName("");
      await addToCollection(
        data.collection.id
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSavingId("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Save to collection
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Organize this image into a
              collection.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close collections"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <form
            onSubmit={createCollection}
            className="mb-5 flex gap-2"
          >
            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="New collection name"
              maxLength={60}
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            />
            <button
              type="submit"
              disabled={
                !name.trim() ||
                savingId === "new"
              }
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingId === "new" ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Plus size={15} />
              )}
              Create
            </button>
          </form>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Create your first collection,
              like Anime Inspiration or
              Favorite Landscapes.
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map(
                (collection) => {
                  const alreadySaved =
                    collection.artworkIds.includes(
                      artworkId
                    );

                  return (
                    <button
                      key={collection.id}
                      type="button"
                      disabled={!!savingId}
                      onClick={() =>
                        alreadySaved
                          ? removeFromCollection(
                              collection.id
                            )
                          : addToCollection(
                              collection.id
                            )
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                          <Bookmark
                            size={17}
                            className={
                              alreadySaved
                                ? "fill-cyan-600"
                                : ""
                            }
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-950">
                            {collection.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {collection.count}{" "}
                            {collection.count ===
                            1
                              ? "image"
                              : "images"}
                          </span>
                        </span>
                      </span>

                      <span className="text-xs font-semibold text-cyan-700">
                        {alreadySaved
                          ? savingId ===
                            collection.id
                            ? "Removing..."
                            : "Remove"
                          : savingId ===
                            collection.id
                          ? "Saving..."
                          : "Add"}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
