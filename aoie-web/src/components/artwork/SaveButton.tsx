"use client";

import { useEffect, useState } from "react";

interface SaveButtonProps {
  artworkId: string;
}

export default function SaveButton({
  artworkId,
}: SaveButtonProps) {
  const [saved, setSaved] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    fetchSaveStatus();
  }, [artworkId]);

  async function fetchSaveStatus() {
    try {
      const response =
        await fetch(
          `/api/artworks/${artworkId}/save`
        );

      const data =
        await response.json();

      if (data.success) {
        setSaved(data.saved);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSubmitting(true);

      const response =
        await fetch(
          `/api/artworks/${artworkId}/save`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!data.success) {
        return;
      }

      setSaved(data.saved);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className="rounded-md border px-4 py-2 text-sm"
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={submitting}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        saved
          ? "border border-slate-300 bg-white text-slate-900"
          : "bg-slate-950 text-white"
      }`}
    >
      {submitting
        ? "Saving..."
        : saved
        ? "Saved"
        : "Save"}
    </button>
  );
}