"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Send,
  X,
} from "lucide-react";

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

const maxSampleSize = 10 * 1024 * 1024;
const maxSamples = 5;

type SamplePreview = {
  id: string;
  file: File;
  url: string;
};

export default function ArtistApplicationForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] =
    useState(initialDisplayName);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([]);
  const [samples, setSamples] = useState<
    SamplePreview[]
  >([]);
  const [ownershipConfirmed, setOwnershipConfirmed] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusType, setStatusType] = useState<"info" | "error" | "success">("info");

  useEffect(() => {
    return () => {
      samples.forEach((sample) =>
        URL.revokeObjectURL(sample.url)
      );
    };
  }, [samples]);

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function addSamples(fileList?: FileList | null) {
    if (!fileList) return;

    const availableSlots =
      maxSamples - samples.length;

    if (availableSlots <= 0) {
      setMessage(`You can upload up to ${maxSamples} sample images.`);
      return;
    }

    const previews: SamplePreview[] = [];

    for (const file of Array.from(fileList).slice(0, availableSlots)) {
      if (!file.type.startsWith("image/")) {
        setMessage("Sample files must be images from your machine.");
        continue;
      }

      if (file.size > maxSampleSize) {
        setMessage("Each sample image must be 10MB or smaller.");
        continue;
      }

      previews.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      });
    }

    if (previews.length > 0) {
      setSamples((current) => [...current, ...previews]);
      setMessage("");
    }
  }

  function removeSample(sampleId: string) {
    setSamples((current) => {
      const sample = current.find(
        (item) => item.id === sampleId
      );

      if (sample) {
        URL.revokeObjectURL(sample.url);
      }

      return current.filter(
        (item) => item.id !== sampleId
      );
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (!displayName.trim()) {
      setStatusType("error");
      setMessage("Please enter your public artist display name.");
      return;
    }

    if (bio.trim().length < 40) {
      setStatusType("error");
      setMessage(
        `Artist bio must be at least 40 characters long (currently ${bio.trim().length}/40 characters). Please elaborate on your background, style, or creative process.`
      );
      return;
    }

    if (!website.trim()) {
      setStatusType("error");
      setMessage(
        "Please provide a valid portfolio or social media link (e.g. https://instagram.com/yourname)."
      );
      return;
    }

    if (selectedCategories.length === 0) {
      setStatusType("error");
      setMessage(
        "Please select at least 1 main category that best describes your art."
      );
      return;
    }

    if (samples.length < 2) {
      setStatusType("error");
      setMessage("Please upload at least 2 sample artwork images for admin review.");
      return;
    }

    if (!ownershipConfirmed) {
      setStatusType("error");
      setMessage(
        "Please check the confirmation box verifying you own or have permission to publish this artwork."
      );
      return;
    }

    setLoading(true);

    try {
      setStatusType("info");
      setMessage("Uploading sample images...");

      const sampleFormData = new FormData();
      samples.forEach((sample) => {
        sampleFormData.append("files", sample.file);
      });

      const uploadResponse = await fetch(
        "/api/artist-applications/samples",
        {
          method: "POST",
          body: sampleFormData,
        }
      );
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(
          uploadData.message ||
            "Could not upload sample images."
        );
      }

      setMessage("Submitting application...");

      const response = await fetch(
        "/api/artist-applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName,
            bio,
            location,
            website,
            categories: selectedCategories,
            sampleLinks: uploadData.imageUrls,
            ownershipConfirmed,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not submit application."
        );
      }

      setStatusType("success");
      setMessage(
        "Application submitted! Your account will stay as a user until admin approval."
      );
      router.refresh();
      router.push("/profile");
    } catch (error) {
      setStatusType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Artist display name
          <input
            value={displayName}
            onChange={(event) =>
              setDisplayName(event.target.value)
            }
            maxLength={60}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            placeholder="Your public artist name"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          <div className="flex items-center justify-between">
            <span>Artist bio <span className="text-rose-500">*</span></span>
            <span
              className={`text-xs font-semibold ${
                bio.trim().length < 40 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {bio.trim().length < 40
                ? `Min 40 characters required (${40 - bio.trim().length} more needed)`
                : "Minimum met ✓"}
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(event) =>
              setBio(event.target.value)
            }
            maxLength={800}
            rows={5}
            className={`resize-none rounded-2xl border px-4 py-3 text-base text-slate-950 outline-none transition focus:ring-4 ${
              bio.length > 0 && bio.trim().length < 40
                ? "border-amber-300 focus:border-amber-400 focus:ring-amber-100"
                : "border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
            }`}
            placeholder="Tell admins about your style, process, and what you create. Minimum 40 characters."
          />
          <div className="flex justify-end text-xs font-medium text-slate-500">
            {bio.length}/800
          </div>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Portfolio or social link
            <input
              value={website}
              onChange={(event) =>
                setWebsite(event.target.value)
              }
              maxLength={240}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              placeholder="https://..."
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Location
            <input
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              maxLength={80}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              placeholder="Optional"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">
            Main categories
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected =
                selectedCategories.includes(category);

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    toggleCategory(category)
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">
            Sample artwork images
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Upload 2 to 5 local images from your machine. JPG, PNG, WEBP, or
            GIF, max 10MB each.
          </p>

          <label
            htmlFor="sample-images"
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={(event) => {
              event.preventDefault();
              addSamples(event.dataTransfer.files);
            }}
            className="mt-3 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-cyan-300 hover:bg-cyan-50/40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-slate-950">
              Drop sample images here or browse
            </span>
            <span className="mt-1 text-xs text-slate-500">
              These are only for admin review.
            </span>
          </label>

          <input
            id="sample-images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(event) => {
              addSamples(event.target.files);
              event.target.value = "";
            }}
            className="sr-only"
          />

          {samples.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={sample.url}
                      alt={sample.file.name}
                      fill
                      sizes="(min-width: 1024px) 180px, 45vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="min-w-0 truncate text-xs font-semibold text-slate-700">
                      {sample.file.name}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        removeSample(sample.id)
                      }
                      className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                      aria-label="Remove sample image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={ownershipConfirmed}
            onChange={(event) =>
              setOwnershipConfirmed(
                event.target.checked
              )
            }
            className="mt-1 h-4 w-4"
          />
          <span>
            I confirm I own or have permission to upload and publish the artwork
            I submit on AOIE.
          </span>
        </label>

        {message && (
          <div
            className={`flex items-start gap-2.5 rounded-2xl p-4 text-sm font-semibold border transition-all ${
              statusType === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : statusType === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-cyan-50 border-cyan-200 text-cyan-800"
            }`}
          >
            {statusType === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            ) : statusType === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-cyan-600" />
            )}
            <div className="flex-1">{message}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit application
        </button>
      </div>
    </form>
  );
}
