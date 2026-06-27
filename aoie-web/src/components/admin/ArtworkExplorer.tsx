"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Filter,
  Grid,
  Heart,
  Images,
  Info,
  Layers,
  List,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";

interface ArtistInfo {
  _id: string;
  username?: string | null;
  email: string;
  artistProfile?: {
    displayName?: string;
    avatar?: string;
  };
}

interface ArtworkItem {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  tags?: string[];
  views: number;
  likesCount: number;
  isPublished: boolean;
  createdAt: string;
  artist?: ArtistInfo | null;
}

interface ArtworkMetrics {
  totalCount: number;
  publishedCount: number;
  unpublishedCount: number;
  totalViews: number;
  totalLikes: number;
  topCategories: { category: string; count: number }[];
}

export default function ArtworkExplorer({
  initialArtworks,
  initialMetrics,
}: {
  initialArtworks: ArtworkItem[];
  initialMetrics: ArtworkMetrics;
}) {
  const [artworks, setArtworks] = useState<ArtworkItem[]>(initialArtworks);
  const [metrics, setMetrics] = useState<ArtworkMetrics>(initialMetrics);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  async function fetchArtworks(
    status = filterStatus,
    cat = filterCategory,
    query = searchTerm
  ) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (cat !== "all") params.set("category", cat);
      if (query.trim()) params.set("search", query.trim());

      const response = await fetch(`/api/admin/artworks?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setArtworks(data.artworks);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTogglePublished(artwork: ArtworkItem) {
    setActionId(artwork._id);
    setFeedback("");
    try {
      const response = await fetch(`/api/admin/artworks/${artwork._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !artwork.isPublished }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update artwork status.");
      }

      setFeedback(data.message);
      fetchArtworks();
      if (selectedArtwork?._id === artwork._id) {
        setSelectedArtwork({ ...selectedArtwork, isPublished: !artwork.isPublished });
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error updating status.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDeleteArtwork(artworkId: string) {
    if (!confirm("Are you sure you want to permanently delete this artwork record?")) return;
    setActionId(artworkId);
    setFeedback("");
    try {
      const response = await fetch(`/api/admin/artworks/${artworkId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete artwork.");
      }

      setFeedback(data.message);
      setSelectedArtwork(null);
      fetchArtworks();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error deleting artwork.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Telemetry Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Images className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Total Artworks
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {metrics.totalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Eye className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Published Feeds
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {metrics.publishedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <EyeOff className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                Delisted / Hidden
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {metrics.unpublishedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-purple-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Heart className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                Total Platform Likes
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {metrics.totalLikes}
              </p>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-cyan-50 p-4 text-sm font-bold text-cyan-900 border border-cyan-200">
          <Info className="h-4 w-4 text-cyan-600" />
          {feedback}
        </div>
      )}

      {/* Filter Controls & Search Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchArtworks(filterStatus, filterCategory, e.target.value);
              }}
              placeholder="Search by artwork title or tags..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Select */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  fetchArtworks(filterStatus, e.target.value, searchTerm);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-cyan-500"
              >
                <option value="all">All Categories</option>
                {metrics.topCategories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-full p-1.5 transition ${
                  viewMode === "grid" ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-full p-1.5 transition ${
                  viewMode === "table" ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => fetchArtworks(filterStatus, filterCategory, searchTerm)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {["all", "published", "unpublished"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setFilterStatus(st);
                fetchArtworks(st, filterCategory, searchTerm);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold capitalize transition ${
                filterStatus === st
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Artworks Content Explorer */}
      {artworks.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Images className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-800">No artwork records match your criteria.</p>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your search filters or clearing search queries.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artworks.map((artwork) => (
            <div
              key={artwork._id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
            >
              <div>
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold backdrop-blur-md shadow-xs ${
                        artwork.isPublished
                          ? "bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30"
                          : "bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30"
                      }`}
                    >
                      {artwork.isPublished ? "Published" : "Delisted"}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="truncate text-base font-extrabold text-slate-950">{artwork.title}</h3>
                    <span className="inline-block mt-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                      {artwork.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {artwork.artist?.artistProfile?.avatar ? (
                      <img
                        src={artwork.artist.artistProfile.avatar}
                        alt="Artist"
                        className="h-7 w-7 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                        <User className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="truncate text-xs font-bold text-slate-800">
                      {artwork.artist?.artistProfile?.displayName || artwork.artist?.username || "Artist"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-slate-400" />{artwork.views}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-rose-500" />{artwork.likesCount}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={actionId === artwork._id}
                    onClick={() => handleTogglePublished(artwork)}
                    className={`rounded-xl p-2 transition ${
                      artwork.isPublished
                        ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                    title={artwork.isPublished ? "Delist Artwork" : "Publish Artwork"}
                  >
                    {actionId === artwork._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : artwork.isPublished ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedArtwork(artwork)}
                    className="rounded-xl bg-slate-950 p-2 text-white transition hover:bg-cyan-700"
                    title="Inspect Details"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Artwork</th>
                  <th className="px-6 py-4">Artist</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Engagement</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {artworks.map((artwork) => (
                  <tr key={artwork._id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          className="h-12 w-16 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-extrabold text-slate-950">{artwork.title}</p>
                          <p className="text-xs text-slate-400">{new Date(artwork.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {artwork.artist?.artistProfile?.avatar ? (
                          <img
                            src={artwork.artist.artistProfile.avatar}
                            alt="Avatar"
                            className="h-7 w-7 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                            <User className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <span className="font-bold text-slate-900">
                          {artwork.artist?.artistProfile?.displayName || artwork.artist?.username || "Artist"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {artwork.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <div className="flex items-center gap-3 text-xs">
                        <span>{artwork.views} views</span>
                        <span className="text-rose-600 font-bold">{artwork.likesCount} likes</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                          artwork.isPublished
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        }`}
                      >
                        {artwork.isPublished ? "Published" : "Delisted"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionId === artwork._id}
                          onClick={() => handleTogglePublished(artwork)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            artwork.isPublished
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {artwork.isPublished ? "Delist" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedArtwork(artwork)}
                          className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-cyan-700"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Inspection Drawer */}
      {selectedArtwork && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">Artwork Telemetry & Details</h3>
                <p className="text-xs font-semibold text-slate-500">ID: {selectedArtwork._id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArtwork(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
              <img
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                className="max-h-80 w-full object-contain"
              />
            </div>

            <div className="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Title</span>
                <span className="font-extrabold text-slate-950">{selectedArtwork.title}</span>
              </div>
              <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Artist</span>
                <div className="text-right">
                  <p className="font-bold text-slate-950">
                    {selectedArtwork.artist?.artistProfile?.displayName || selectedArtwork.artist?.username}
                  </p>
                  <p className="text-xs font-mono text-slate-500">{selectedArtwork.artist?.email}</p>
                </div>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Category</span>
                <span className="font-bold text-slate-800">{selectedArtwork.category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Engagement</span>
                <span className="font-bold text-slate-900">
                  {selectedArtwork.views} views • {selectedArtwork.likesCount} likes
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="font-semibold text-slate-500">Published Status</span>
                <span className={`font-bold ${selectedArtwork.isPublished ? "text-emerald-700" : "text-rose-700"}`}>
                  {selectedArtwork.isPublished ? "Live in feeds" : "Delisted"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Uploaded On</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedArtwork.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedArtwork.tags && selectedArtwork.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Associated Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedArtwork.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <Link
                href={`/artwork/${selectedArtwork._id}`}
                target="_blank"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
              >
                View Live Page on Site
              </Link>

              <button
                type="button"
                onClick={() => handleTogglePublished(selectedArtwork)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  selectedArtwork.isPublished
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {selectedArtwork.isPublished ? "Delist from Public Feeds" : "Publish to Public Feeds"}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteArtwork(selectedArtwork._id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Permanently Purge Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
