"use client";

import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FollowListType = "followers" | "following";

interface FollowUser {
  id: string;
  username: string;
  role: string;
  displayName: string;
  avatar?: string;
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
  const [openList, setOpenList] = useState<FollowListType | null>(null);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openPopup = async (listType: FollowListType) => {
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
        throw new Error(data.message || "Unable to load users");
      }

      setUsers(data.users);
    } catch {
      setError("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const title = openList === "followers" ? "Followers" : "Following";

  return (
    <>
      {/* Editorial Style Stats Counters */}
      <div className="flex items-center gap-6 text-sm">
        <button
          type="button"
          onClick={() => openPopup("followers")}
          className="group flex items-baseline gap-1.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors focus:outline-none cursor-pointer"
        >
          <span className="text-base font-bold tracking-tight text-slate-950 transition-colors group-hover:text-slate-900">
            {followersCount}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold group-hover:text-slate-500 transition-colors">
            followers
          </span>
        </button>

        <button
          type="button"
          onClick={() => openPopup("following")}
          className="group flex items-baseline gap-1.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors focus:outline-none cursor-pointer"
        >
          <span className="text-base font-bold tracking-tight text-slate-950 transition-colors group-hover:text-slate-900">
            {followingCount}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold group-hover:text-slate-500 transition-colors">
            following
          </span>
        </button>
      </div>

      {/* Animated Modal Overlay */}
      <AnimatePresence>
        {openList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Smooth Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenList(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              transition={{ duration: 0.2 }}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="relative w-full max-w-sm overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-2xl z-10 flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                  {title}
                </h2>

                <button
                  type="button"
                  onClick={() => setOpenList(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Close popup"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="max-h-[380px] overflow-y-auto p-4 space-y-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2.5">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Loading users...</p>
                  </div>
                ) : error ? (
                  <p className="px-2 py-8 text-center text-xs font-bold text-red-500">
                    {error}
                  </p>
                ) : users.length === 0 ? (
                  <p className="px-2 py-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    No {openList} found
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {users.map((user) => {
                      const userInitial = user.username.slice(0, 1).toUpperCase();
                      
                      const content = (
                        <div className="group flex items-center justify-between rounded-xl px-2.5 py-2.5 transition-colors duration-200 hover:bg-slate-50">
                          <div className="flex items-center gap-3 min-w-0">
                            
                            {/* Avatar */}
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200/40 flex items-center justify-center shadow-sm">
                              {user.avatar ? (
                                <Image
                                  src={user.avatar}
                                  alt={user.displayName}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="text-xs font-extrabold text-slate-500">
                                  {userInitial}
                                </span>
                              )}
                            </div>

                            {/* Meta */}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                                {user.displayName}
                              </p>
                              <p className="truncate text-[10.5px] font-semibold text-slate-400">
                                @{user.username}
                              </p>
                            </div>

                          </div>

                          {/* Role Badge */}
                          {user.role !== "user" && (
                            <span className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              user.role === "artist" 
                                ? "bg-cyan-50 text-cyan-800" 
                                : "bg-indigo-50 text-indigo-800"
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </div>
                      );

                      return (
                        <li key={user.id}>
                          {user.role === "artist" ? (
                            <Link
                              href={`/artist/${user.username}`}
                              onClick={() => setOpenList(null)}
                              className="block"
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

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

