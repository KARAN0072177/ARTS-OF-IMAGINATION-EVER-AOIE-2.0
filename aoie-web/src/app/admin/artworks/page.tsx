import { Images, Sparkles } from "lucide-react";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import UserInteraction from "@/models/UserInteraction";
import User from "@/models/User";
import ArtworkExplorer from "@/components/admin/ArtworkExplorer";

void User;

export default async function AdminArtworksPage() {
  await connectDB();

  const [
    artworksRaw,
    totalCount,
    publishedCount,
    unpublishedCount,
    engagementAgg,
    topCategoriesRaw,
    totalLikesReal,
    totalViewsInteractions,
  ] = await Promise.all([
    Artwork.find()
      .populate("artist", "username email artistProfile")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Artwork.countDocuments(),
    Artwork.countDocuments({ isPublished: true }),
    Artwork.countDocuments({ isPublished: false }),
    Artwork.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likesCount" },
        },
      },
    ]),
    Artwork.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Like.countDocuments(),
    UserInteraction.countDocuments({ type: "view" }),
  ]);

  const artworkIds = artworksRaw.map((a) => a._id);

  const [likesGroup, viewsGroup] = await Promise.all([
    artworkIds.length > 0
      ? Like.aggregate([
          { $match: { artwork: { $in: artworkIds } } },
          { $group: { _id: "$artwork", count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
    artworkIds.length > 0
      ? UserInteraction.aggregate([
          { $match: { artwork: { $in: artworkIds }, type: "view" } },
          { $group: { _id: "$artwork", count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
  ]);

  const likesMap = new Map(likesGroup.map((g) => [g._id.toString(), g.count]));
  const viewsMap = new Map(viewsGroup.map((g) => [g._id.toString(), g.count]));

  const artworksWithRealStats = artworksRaw.map((a) => {
    const idStr = a._id.toString();
    const realLikes = likesMap.get(idStr) ?? 0;
    const realViews = viewsMap.get(idStr) ?? 0;
    return {
      ...a,
      likesCount: Math.max(a.likesCount || 0, realLikes),
      views: Math.max(a.views || 0, realViews),
    };
  });

  const artworks = JSON.parse(JSON.stringify(artworksWithRealStats));
  const metrics = JSON.parse(
    JSON.stringify({
      totalCount,
      publishedCount,
      unpublishedCount,
      totalViews: Math.max(engagementAgg[0]?.totalViews || 0, totalViewsInteractions),
      totalLikes: Math.max(engagementAgg[0]?.totalLikes || 0, totalLikesReal),
      topCategories: topCategoriesRaw.map((c) => ({
        category: c._id || "Uncategorized",
        count: c.count,
      })),
    })
  );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20 text-slate-100">
        {/* Cyber Hero Banner Header */}
        <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white overflow-hidden">
          <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-1/3 -bottom-12 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-inner">
                  <Images className="h-3.5 w-3.5 text-cyan-400" />
                  Content Operations
                </span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                Artworks Management <Sparkles className="h-6 w-6 text-cyan-400" />
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                Monitor platform-wide artwork uploads, track engagement velocity, toggle visibility in public feeds, and inspect creator metadata.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-slate-950/40">
          <ArtworkExplorer initialArtworks={artworks} initialMetrics={metrics} />
        </div>
      </div>
    </section>
  );
}
