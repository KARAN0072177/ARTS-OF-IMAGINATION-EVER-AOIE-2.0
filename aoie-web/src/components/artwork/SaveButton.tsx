"use client";

import { useState } from "react";

interface SaveButtonProps {
  artworkId: string;
  initialSaved: boolean;
}

export default function SaveButton({
  artworkId,
  initialSaved,
}: SaveButtonProps) {
  const [saved, setSaved] =
    useState(initialSaved);

  const [submitting, setSubmitting] =
    useState(false);

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
