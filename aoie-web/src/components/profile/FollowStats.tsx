"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type FollowListType = "followers" | "following";

interface FollowUser {
  id: string;
  username: string;
  role: string;
  displayName: string;
}

interface FollowStatsProps {
  userId: string;
  followersCount: number;
  followingCount: number;
}

export default function FollowStats({
  userId,
  followersCount,
  followingCount,
}: FollowStatsProps) {
  const [openList, setOpenList] =
    useState<FollowListType | null>(null);
  const [users, setUsers] = useState<
    FollowUser[]
  >([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  const openPopup = async (
    listType: FollowListType
  ) => {
    setOpenList(listType);
    setUsers([]);
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/users/${userId}/follow?list=${listType}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Unable to load users"
        );
      }

      setUsers(data.users);
    } catch {
      setError("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const title =
    openList === "followers"
      ? "Followers"
      : "Following";

  return (
    <>
      <div className="flex items-center gap-4 text-sm text-slate-600">

        <button
          type="button"
          onClick={() =>
            openPopup("followers")
          }
          className="rounded-md px-1 py-1 font-medium transition hover:text-cyan-700"
        >
          <span className="font-semibold text-slate-950">
            {followersCount}
          </span>{" "}
          followers
        </button>

        <button
          type="button"
          onClick={() =>
            openPopup("following")
          }
          className="rounded-md px-1 py-1 font-medium transition hover:text-cyan-700"
        >
          <span className="font-semibold text-slate-950">
            {followingCount}
          </span>{" "}
          following
        </button>


      </div>

      {openList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                {title}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setOpenList(null)
                }
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close popup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3">
              {loading ? (
                <p className="px-2 py-8 text-center text-sm text-slate-500">
                  Loading users...
                </p>
              ) : error ? (
                <p className="px-2 py-8 text-center text-sm text-red-600">
                  {error}
                </p>
              ) : users.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-slate-500">
                  No users found.
                </p>
              ) : (
                <ul className="space-y-2">
                  {users.map((user) => {
                    const content = (
                      <div className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-slate-50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                          {user.username
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {user.displayName}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    );

                    return (
                      <li key={user.id}>
                        {user.role === "artist" ? (
                          <Link
                            href={`/artist/${user.username}`}
                            onClick={() =>
                              setOpenList(null)
                            }
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
