"use client";

import {
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { useState } from "react";

interface ArtistProfile {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar?: string;
  banner?: string;
  isArtistProfileComplete?: boolean;
}

interface ArtistProfileFormProps {
  initialProfile?: ArtistProfile;
  username: string;
}

export default function ArtistProfileForm({
  initialProfile,
  username,
}: ArtistProfileFormProps) {
  const [form, setForm] =
    useState<ArtistProfile>({
      displayName:
        initialProfile?.displayName ||
        username,
      bio: initialProfile?.bio || "",
      website:
        initialProfile?.website || "",
      location:
        initialProfile?.location || "",
      avatar: initialProfile?.avatar || "",
      banner: initialProfile?.banner || "",
      isArtistProfileComplete:
        initialProfile?.isArtistProfileComplete ||
        false,
    });
  const [saving, setSaving] =
    useState(false);
  const [uploadingField, setUploadingField] =
    useState<"avatar" | "banner" | "">(
      ""
    );
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  const updateField = (
    key: keyof ArtistProfile,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update artist profile"
        );
      }

      setForm(data.artistProfile);
      setMessage(
        "Artist profile updated successfully."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async (
    key: "avatar" | "banner",
    file: File | null
  ) => {
    if (!file) {
      return;
    }

    setUploadingField(key);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", key);

      const response = await fetch(
        "/api/profile/media",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to upload profile media"
        );
      }

      updateField(key, data.imageUrl);
      setMessage(
        `${
          key === "avatar"
            ? "Profile photo"
            : "Banner"
        } uploaded. Save your profile to publish it.`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setUploadingField("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Artist profile
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These details appear on your
            public artist page.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            form.isArtistProfileComplete
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {form.isArtistProfileComplete
            ? "Complete"
            : "Incomplete"}
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="relative h-36 bg-slate-200">
          {form.banner ? (
            <img
              src={form.banner}
              alt="Artist banner preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
              Banner preview
            </div>
          )}
        </div>

        <div className="-mt-10 flex items-end gap-4 px-5 pb-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-950 text-2xl font-semibold text-white shadow-sm">
            {form.avatar ? (
              <img
                src={form.avatar}
                alt="Artist avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              (form.displayName ||
                username)
                .slice(0, 1)
                .toUpperCase()
            )}
          </div>

          <div className="min-w-0 pb-1">
            <p className="truncate text-lg font-semibold text-slate-950">
              {form.displayName ||
                username}
            </p>
            <p className="text-sm text-slate-500">
              @{username}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Display name
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-100">
            <UserRound
              size={17}
              className="text-slate-400"
            />
            <input
              value={form.displayName || ""}
              onChange={(event) =>
                updateField(
                  "displayName",
                  event.target.value
                )
              }
              maxLength={60}
              className="min-w-0 flex-1 py-2.5 text-sm outline-none"
              placeholder="Your public name"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Location
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-100">
            <MapPin
              size={17}
              className="text-slate-400"
            />
            <input
              value={form.location || ""}
              onChange={(event) =>
                updateField(
                  "location",
                  event.target.value
                )
              }
              maxLength={80}
              className="min-w-0 flex-1 py-2.5 text-sm outline-none"
              placeholder="City, country"
            />
          </div>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Bio
          </span>
          <textarea
            value={form.bio || ""}
            onChange={(event) =>
              updateField(
                "bio",
                event.target.value
              )
            }
            maxLength={500}
            rows={4}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            placeholder="Tell viewers about your style, process, or inspiration."
          />
          <span className="mt-1 block text-xs text-slate-500">
            {(form.bio || "").length}/500
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Website
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-100">
            <LinkIcon
              size={17}
              className="text-slate-400"
            />
            <input
              value={form.website || ""}
              onChange={(event) =>
                updateField(
                  "website",
                  event.target.value
                )
              }
              className="min-w-0 flex-1 py-2.5 text-sm outline-none"
              placeholder="https://yourportfolio.com"
            />
          </div>
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <span className="text-sm font-semibold text-slate-700">
            Profile photo
          </span>
          <p className="mt-1 text-xs text-slate-500">
            Square images work best.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            {uploadingField ===
            "avatar" ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <ImageIcon size={16} />
            )}
            {uploadingField ===
            "avatar"
              ? "Uploading"
              : "Choose photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={!!uploadingField}
              onChange={(event) => {
                void handleMediaUpload(
                  "avatar",
                  event.target.files?.[0] ||
                    null
                );
                event.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <span className="text-sm font-semibold text-slate-700">
            Banner image
          </span>
          <p className="mt-1 text-xs text-slate-500">
            Wide images work best for
            artist pages.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            {uploadingField ===
            "banner" ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <ImageIcon size={16} />
            )}
            {uploadingField ===
            "banner"
              ? "Uploading"
              : "Choose banner"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={!!uploadingField}
              onChange={(event) => {
                void handleMediaUpload(
                  "banner",
                  event.target.files?.[0] ||
                    null
                );
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !!uploadingField}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <Loader2
            size={17}
            className="animate-spin"
          />
        ) : (
          <Save size={17} />
        )}
        {saving
          ? "Saving profile"
          : "Save artist profile"}
      </button>
    </form>
  );
}
