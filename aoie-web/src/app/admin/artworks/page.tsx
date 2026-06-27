import { Images } from "lucide-react";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
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
  ]);

  const artworks = JSON.parse(JSON.stringify(artworksRaw));
  const metrics = JSON.parse(
    JSON.stringify({
      totalCount,
      publishedCount,
      unpublishedCount,
      totalViews: engagementAgg[0]?.totalViews || 0,
      totalLikes: engagementAgg[0]?.totalLikes || 0,
      topCategories: topCategoriesRaw.map((c) => ({
        category: c._id || "Uncategorized",
        count: c.count,
      })),
    })
  );

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-white p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-700">
            <Images className="h-4 w-4" />
            Content Telemetry
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
            Artworks Operations
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Monitor platform-wide artwork uploads, track engagement velocity, toggle visibility in public feeds, and inspect creator metadata.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <ArtworkExplorer initialArtworks={artworks} initialMetrics={metrics} />
        </div>
      </div>
    </section>
  );
}
