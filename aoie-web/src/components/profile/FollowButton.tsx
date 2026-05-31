"use client";

import { useState } from "react";

import FollowStats from "@/components/profile/FollowStats";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  initialFollowersCount: number;
  initialFollowingCount: number;
}

export default function FollowButton({
  userId,
  initialFollowing,
  initialFollowersCount,
  initialFollowingCount,
}: FollowButtonProps) {
  const [following, setFollowing] =
    useState(initialFollowing);

  const [followersCount, setFollowersCount] =
    useState(initialFollowersCount);

  const [followingCount] =
    useState(initialFollowingCount);

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

  return (
    <div className="flex flex-wrap items-center gap-4">
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

      <FollowStats
        userId={userId}
        followersCount={followersCount}
        followingCount={followingCount}
      />
    </div>
  );
}
