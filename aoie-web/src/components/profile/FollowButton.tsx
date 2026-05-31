"use client";

import { useEffect, useState } from "react";

interface FollowButtonProps {
  userId: string;
}

export default function FollowButton({
  userId,
}: FollowButtonProps) {
  const [loading, setLoading] =
    useState(true);

  const [following, setFollowing] =
    useState(false);

  const [followersCount, setFollowersCount] =
    useState(0);

  useEffect(() => {
    fetchFollowStatus();
  }, []);

  async function fetchFollowStatus() {
    try {
      const response = await fetch(
        `/api/users/${userId}/follow`
      );

      const data =
        await response.json();

      if (data.success) {
        setFollowing(
          data.following
        );

        setFollowersCount(
          data.followersCount
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    try {
      const response = await fetch(
        `/api/users/${userId}/follow`,
        {
          method: "POST",
        }
      );

      const data =
        await response.json();

      if (!data.success) {
        return;
      }

      setFollowing(
        data.following
      );

      setFollowersCount(
        data.followersCount
      );
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleFollow}
        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
          following
            ? "border border-slate-300 bg-white text-slate-900"
            : "bg-slate-950 text-white"
        }`}
      >
        {following
          ? "Following"
          : "Follow"}
      </button>

      <span className="text-sm text-slate-600">
        {followersCount} followers
      </span>
    </div>
  );
}