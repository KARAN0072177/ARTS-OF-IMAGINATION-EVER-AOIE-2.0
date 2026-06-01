"use client";

import { useEffect, useState } from "react";

interface CommentUser {
  _id: string;
  username: string;
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentSectionProps {
  artworkId: string;
}

export default function CommentSection({
  artworkId,
}: CommentSectionProps) {
  const [comments, setComments] =
    useState<Comment[]>([]);

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function fetchComments() {
    try {
      const response =
        await fetch(
          `/api/artworks/${artworkId}/comments`
        );

      const data =
        await response.json();

      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchComments();
  }, [artworkId]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `/api/artworks/${artworkId}/comments`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              content,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message
        );
      }

      setComments((prev) => [
        data.comment,
        ...prev,
      ]);

      setContent("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">
        Comments
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mb-8"
      >
        <textarea
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          placeholder="Write a comment..."
          rows={4}
          className="w-full rounded-lg border border-slate-300 p-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-3 rounded-md bg-slate-950 px-5 py-2 text-white"
        >
          {loading
            ? "Posting..."
            : "Post Comment"}
        </button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-slate-500">
            No comments yet.
          </div>
        ) : (
          comments.map(
            (comment) => (
              <div
                key={comment._id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    @{comment.user.username}
                  </p>

                  <p className="text-sm text-slate-500">
                    {new Date(
                      comment.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                <p className="mt-2 text-slate-700">
                  {comment.content}
                </p>
              </div>
            )
          )
        )}
      </div>
    </section>
  );
}