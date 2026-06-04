"use client";

import {
  Bookmark,
  Download,
  Heart,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ReportArtworkButton from "@/components/artwork/ReportArtworkButton";

interface ArtworkDetailActionsProps {
  artworkId: string;
  title: string;
  initialLiked: boolean;
  initialLikesCount: number;
  initialSaved: boolean;
}

export default function ArtworkDetailActions({
  artworkId,
  title,
  initialLiked,
  initialLikesCount,
  initialSaved,
}: ArtworkDetailActionsProps) {
  const router = useRouter();

  const [liked, setLiked] =
    useState(initialLiked);
  const [likesCount, setLikesCount] =
    useState(initialLikesCount);
  const [saved, setSaved] =
    useState(initialSaved);
  const [likeSaving, setLikeSaving] =
    useState(false);
  const [saveSaving, setSaveSaving] =
    useState(false);
  const [shareStatus, setShareStatus] =
    useState<"idle" | "copied">("idle");

  async function recordInteraction(
    type: "share" | "download"
  ) {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          artworkId,
          type,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLike() {
    if (likeSaving) {
      return;
    }

    const previousLiked = liked;
    const previousCount = likesCount;
    const nextLiked = !previousLiked;
    const nextCount = previousLiked
      ? Math.max(0, previousCount - 1)
      : previousCount + 1;

    setLikeSaving(true);
    setLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      const response = await fetch(
        `/api/artworks/${artworkId}/like`,
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
      setLikesCount(data.likesCount);
    } catch {
      setLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setLikeSaving(false);
    }
  }

  async function handleSave() {
    if (saveSaving) {
      return;
    }

    setSaveSaving(true);

    try {
      const response = await fetch(
        `/api/artworks/${artworkId}/save`,
        {
          method: "POST",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSaved(data.saved);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaveSaving(false);
    }
  }

  async function handleShare() {
    const artworkPath = `/artwork/${artworkId}`;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${artworkPath}`
        : artworkPath;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out "${title}" on AOIE 2.0`,
          url: shareUrl,
        });
        await recordInteraction("share");
        return;
      }

      await navigator.clipboard.writeText(
        shareUrl
      );
      await recordInteraction("share");
      setShareStatus("copied");

      window.setTimeout(() => {
        setShareStatus("idle");
      }, 1800);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(error);
    }
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = `/api/artworks/${artworkId}/download`;
    link.download = `${title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "aoie-artwork"}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={likeSaving}
          aria-pressed={liked}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            liked
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          <Heart
            size={17}
            className={
              liked
                ? "fill-rose-500 text-rose-500"
                : ""
            }
          />
          {liked ? "Liked" : "Like"}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveSaving}
          aria-pressed={saved}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            saved
              ? "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Bookmark
            size={17}
            className={
              saved ? "fill-cyan-600" : ""
            }
          />
          {saveSaving
            ? "Saving"
            : saved
              ? "Saved"
              : "Save"}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Share2 size={17} />
          {shareStatus === "copied"
            ? "Copied"
            : "Share"}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Download size={17} />
          Download
        </button>

        <div className="col-span-2 [&>button]:w-full [&>button]:rounded-xl [&>button]:py-3">
          <ReportArtworkButton
            artworkId={artworkId}
            variant="menu"
          />
        </div>
      </div>

      <p className="mt-3 text-center text-xs font-medium text-slate-500">
        {likesCount}{" "}
        {likesCount === 1 ? "like" : "likes"}
      </p>
    </div>
  );
}
