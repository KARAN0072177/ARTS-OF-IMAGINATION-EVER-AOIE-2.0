"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      if (!image) {
        throw new Error(
          "Please select an image"
        );
      }

      const uploadFormData =
        new FormData();

      uploadFormData.append(
        "file",
        image
      );

      const uploadResponse =
        await fetch(
          "/api/upload",
          {
            method: "POST",
            body: uploadFormData,
          }
        );

      const uploadData =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message
        );
      }

      const artworkResponse =
        await fetch(
          "/api/artworks",
          {
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

              tags: tags
                .split(",")
                .map((tag) =>
                  tag.trim()
                )
                .filter(Boolean),
            }),
          }
        );

      const artworkData =
        await artworkResponse.json();

      if (!artworkResponse.ok) {
        throw new Error(
          artworkData.message
        );
      }

      router.refresh();

      alert(
        "Artwork uploaded successfully!"
      );
    } catch (error) {
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
      className="space-y-6 rounded-lg border p-6"
    >
      <div>
        <label className="mb-2 block text-sm font-medium">
          Artwork Title
        </label>

        <input
          type="text"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          required
          className="w-full rounded-md border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Description
        </label>

        <textarea
          rows={5}
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          className="w-full rounded-md border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Category
        </label>

        <select
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
          required
          className="w-full rounded-md border p-3"
        >
          <option value="">
            Select Category
          </option>

          <option>
            Digital Art
          </option>

          <option>
            Anime
          </option>

          <option>
            Fantasy
          </option>

          <option>
            Landscape
          </option>

          <option>
            Photography
          </option>

          <option>
            3D
          </option>

          <option>
            Pixel Art
          </option>

          <option>
            Other
          </option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Tags
        </label>

        <input
          type="text"
          value={tags}
          onChange={(e) =>
            setTags(e.target.value)
          }
          placeholder="anime, cyberpunk, city"
          className="w-full rounded-md border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Artwork Image
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setImage(
              e.target.files?.[0] ??
                null
            )
          }
          required
        />
      </div>

      {error && (
        <p className="text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-5 py-3 text-white disabled:opacity-50"
      >
        {loading
          ? "Uploading..."
          : "Upload Artwork"}
      </button>
    </form>
  );
}