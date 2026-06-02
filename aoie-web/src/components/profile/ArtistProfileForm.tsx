"use client";

import {
  Link as LinkIcon,
  Loader2,
  MapPin,
  Pencil,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

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

interface CropState {
  field: "avatar" | "banner";
  src: string;
  zoom: number;
  x: number;
  y: number;
  naturalWidth: number;
  naturalHeight: number;
}

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
}

const cropConfig = {
  avatar: {
    label: "Profile photo",
    aspect: 1,
    width: 640,
    height: 640,
  },
  banner: {
    label: "Banner image",
    aspect: 3,
    width: 1800,
    height: 600,
  },
};

function getInitial(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(max, Math.max(min, value));
}

async function createCroppedFile(
  crop: CropState
) {
  const image = new window.Image();
  image.src = crop.src;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(
        new Error("Unable to load selected image")
      );
  });

  const config = cropConfig[crop.field];
  const canvas =
    document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to crop image");
  }

  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  let sourceWidth =
    naturalWidth / crop.zoom;
  let sourceHeight =
    sourceWidth / config.aspect;

  if (sourceHeight > naturalHeight / crop.zoom) {
    sourceHeight =
      naturalHeight / crop.zoom;
    sourceWidth =
      sourceHeight * config.aspect;
  }

  const maxX =
    (naturalWidth - sourceWidth) / 2;
  const maxY =
    (naturalHeight - sourceHeight) / 2;
  const sourceX =
    maxX - crop.x * maxX;
  const sourceY =
    maxY - crop.y * maxY;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    config.width,
    config.height
  );

  const blob = await new Promise<Blob | null>(
    (resolve) =>
      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.9
      )
  );

  if (!blob) {
    throw new Error("Unable to prepare image");
  }

  return new File(
    [blob],
    `${crop.field}-${Date.now()}.jpg`,
    {
      type: "image/jpeg",
    }
  );
}

export default function ArtistProfileForm({
  initialProfile,
  username,
}: ArtistProfileFormProps) {
  const avatarInputRef =
    useRef<HTMLInputElement | null>(null);
  const bannerInputRef =
    useRef<HTMLInputElement | null>(null);
  const dragRef =
    useRef<DragState | null>(null);

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
  const [crop, setCrop] =
    useState<CropState | null>(null);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  const displayName =
    form.displayName || username;

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

  const uploadMedia = async (
    key: "avatar" | "banner",
    file: File
  ) => {
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

  const startCrop = (
    field: "avatar" | "banner",
    file: File | null
  ) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }

    setError("");
    setMessage("");
    setCrop({
      field,
      src: URL.createObjectURL(file),
      zoom: 1,
      x: 0,
      y: 0,
      naturalWidth: 0,
      naturalHeight: 0,
    });
  };

  const closeCropper = () => {
    if (crop?.src) {
      URL.revokeObjectURL(crop.src);
    }

    setCrop(null);
  };

  const applyCrop = async () => {
    if (!crop) {
      return;
    }

    try {
      const croppedFile =
        await createCroppedFile(crop);
      const field = crop.field;
      closeCropper();
      await uploadMedia(field, croppedFile);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to crop image"
      );
    }
  };

  const handleCropPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!crop) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: crop.x,
      startY: crop.y,
    };
  };

  const handleCropPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const drag = dragRef.current;

    if (!drag || !crop) {
      return;
    }

    const bounds =
      event.currentTarget.getBoundingClientRect();
    const deltaX =
      (event.clientX - drag.startClientX) /
      bounds.width;
    const deltaY =
      (event.clientY - drag.startClientY) /
      bounds.height;

    setCrop((current) =>
      current
        ? {
            ...current,
            x: clamp(
              drag.startX + deltaX * 2,
              -1,
              1
            ),
            y: clamp(
              drag.startY + deltaY * 2,
              -1,
              1
            ),
          }
        : current
    );
  };

  const handleCropPointerEnd = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      dragRef.current?.pointerId ===
      event.pointerId
    ) {
      dragRef.current = null;
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Artist profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Edit the public details
                visitors see on your artist
                page.
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
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
        </div>

        <div className="p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="group relative h-48 bg-slate-200">
              {form.banner ? (
                <img
                  src={form.banner}
                  alt="Artist banner preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                  Add a banner image
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  bannerInputRef.current?.click()
                }
                disabled={!!uploadingField}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Edit banner image"
              >
                {uploadingField ===
                "banner" ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Pencil size={17} />
                )}
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={!!uploadingField}
                onChange={(event) => {
                  startCrop(
                    "banner",
                    event.target.files?.[0] ||
                      null
                  );
                  event.target.value = "";
                }}
              />
            </div>

            <div className="-mt-12 flex items-end gap-4 px-6 pb-6">
              <div className="group relative">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-950 text-3xl font-semibold text-white shadow-sm">
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt="Artist avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitial(displayName)
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    avatarInputRef.current?.click()
                  }
                  disabled={!!uploadingField}
                  className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Edit profile photo"
                >
                  {uploadingField ===
                  "avatar" ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Pencil size={16} />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={!!uploadingField}
                  onChange={(event) => {
                    startCrop(
                      "avatar",
                      event.target.files?.[0] ||
                        null
                    );
                    event.target.value = "";
                  }}
                />
              </div>

              <div className="min-w-0 pb-2">
                <p className="truncate text-xl font-semibold text-slate-950">
                  {displayName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
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
                  value={
                    form.displayName || ""
                  }
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
                {(form.bio || "").length}
                /500
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
            disabled={
              saving || !!uploadingField
            }
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
        </div>
      </form>

      {crop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Crop{" "}
                  {
                    cropConfig[crop.field]
                      .label
                  }
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Drag the image to
                  position it, then adjust
                  zoom.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCropper}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close cropper"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div
                className={`relative mx-auto overflow-hidden rounded-xl bg-slate-950 ${
                  crop.field === "avatar"
                    ? "aspect-square max-w-sm rounded-full"
                    : "aspect-[3/1] w-full"
                } cursor-grab touch-none active:cursor-grabbing`}
                onPointerDown={
                  handleCropPointerDown
                }
                onPointerMove={
                  handleCropPointerMove
                }
                onPointerUp={
                  handleCropPointerEnd
                }
                onPointerCancel={
                  handleCropPointerEnd
                }
              >
                <img
                  src={crop.src}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={(event) => {
                    const {
                      naturalWidth,
                      naturalHeight,
                    } = event.currentTarget;

                    setCrop((current) =>
                      current
                        ? {
                            ...current,
                            naturalWidth,
                            naturalHeight,
                          }
                        : current
                    );
                  }}
                  className="h-full w-full object-cover"
                  style={{
                    transform: `scale(${crop.zoom}) translate(${crop.x * 18}%, ${crop.y * 18}%)`,
                  }}
                />
              </div>

              <div className="mt-5">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Zoom
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={crop.zoom}
                    onChange={(event) =>
                      setCrop((current) =>
                        current
                          ? {
                              ...current,
                              zoom: Number(
                                event.target.value
                              ),
                            }
                          : current
                      )
                    }
                    className="mt-2 w-full"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCropper}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void applyCrop();
                  }}
                  disabled={!!uploadingField}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingField ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={16} />
                  )}
                  Upload cropped image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
