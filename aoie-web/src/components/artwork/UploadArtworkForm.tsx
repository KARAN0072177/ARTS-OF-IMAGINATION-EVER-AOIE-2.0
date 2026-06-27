"use client";

import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Send,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const categories = [
  "Digital Art",
  "Anime",
  "Fantasy",
  "Landscape",
  "Photography",
  "3D",
  "Pixel Art",
  "Other",
];

const maxImageSize = 10 * 1024 * 1024;

export default function UploadArtworkForm() {
  const router = useRouter();

  const [title, setTitle] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [category, setCategory] =
    useState("");
  const [tags, setTags] =
    useState("");
  const [image, setImage] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [status, setStatus] =
    useState("");

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8),
    [tags]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function setSelectedImage(
    file?: File | null
  ) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please choose a JPG, PNG, WEBP, or GIF image from your machine."
      );
      return;
    }

    if (file.size > maxImageSize) {
      setError(
        "Please choose an image that is 10MB or smaller."
      );
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setStatus("Uploading image...");

      if (!image) {
        throw new Error(
          "Please select an artwork image."
        );
      }

      const uploadFormData =
        new FormData();

      uploadFormData.append(
        "file",
        image
      );

      const uploadResponse =
        await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

      const uploadData =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message ||
            "Image upload failed"
        );
      }

      setStatus("Publishing artwork...");

      const artworkResponse =
        await fetch("/api/artworks", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            category,
            imageUrl:
              uploadData.imageUrl,
            tags: tagList,
            placeholderUrl:
              uploadData.placeholderUrl,
          }),
        });

      const artworkData =
        await artworkResponse.json();

      if (!artworkResponse.ok) {
        throw new Error(
          artworkData.message ||
            "Artwork could not be published"
        );
      }

      setStatus("Artwork published.");
      router.refresh();

      const artworkId =
        artworkData.artwork?._id;

      if (artworkId) {
        router.push(
          `/artwork/${artworkId}`
        );
      }
    } catch (error) {
      setStatus("");
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
    >
      <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Artwork title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
            maxLength={100}
            placeholder="Give your artwork a clear title"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            maxLength={2000}
            placeholder="Add context, process, tools, inspiration, or story behind the piece."
            className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            {description.length}/2000
          </p>
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="">
              Select a category
            </option>
            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tags"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Tags
          </label>
          <div className="relative">
            <Tag
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) =>
                setTags(e.target.value)
              }
              placeholder="anime, cyberpunk, city"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 pl-9 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {tagList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div
            className={`flex items-start gap-2.5 rounded-xl p-4 text-sm font-semibold border ${
              error.includes("violate") || error.includes("guidelines")
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {status && (
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700">
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Send size={17} />
          )}
          {loading
            ? "Publishing..."
            : "Publish artwork"}
        </button>
      </div>

      <aside className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="image"
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={(event) => {
              event.preventDefault();
              setSelectedImage(
                event.dataTransfer.files?.[0]
              );
            }}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-cyan-300 hover:bg-cyan-50/40"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Artwork preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="px-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                  <ImagePlus size={22} />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900">
                  Drop image here or browse
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Upload a clear JPG, PNG, WEBP, or GIF artwork file.
                </p>
              </div>
            )}
          </label>

          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setSelectedImage(
                e.target.files?.[0] ??
                  null
              )
            }
            required
            className="sr-only"
          />

          {image && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
              <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                {image.name}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (previewUrl) {
                    URL.revokeObjectURL(
                      previewUrl
                    );
                  }
                  setImage(null);
                  setPreviewUrl("");
                }}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-950"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            Upload source
          </h2>
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              Local file upload only
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            Preview details
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Title
              </dt>
              <dd className="truncate font-medium text-slate-900">
                {title || "Untitled"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Category
              </dt>
              <dd className="font-medium text-slate-900">
                {category || "Not selected"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Tags
              </dt>
              <dd className="font-medium text-slate-900">
                {tagList.length}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </form>
  );
}
