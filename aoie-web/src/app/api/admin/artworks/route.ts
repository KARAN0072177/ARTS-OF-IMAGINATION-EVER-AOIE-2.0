import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import UserInteraction from "@/models/UserInteraction";
import User from "@/models/User";

void User;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "admin" ||
      session.user.role === "super-admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "all";

    const query: Record<string, unknown> = {};

    if (status === "published") {
      query.isPublished = true;
    } else if (status === "unpublished") {
      query.isPublished = false;
    }

    if (category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

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
      Artwork.find(query)
        .populate("artist", "username email artistProfile")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Artwork.countDocuments(query),
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

    const totalViews = Math.max(engagementAgg[0]?.totalViews || 0, totalViewsInteractions);
    const totalLikes = Math.max(engagementAgg[0]?.totalLikes || 0, totalLikesReal);

    const topCategories = topCategoriesRaw.map((c) => ({
      category: c._id || "Uncategorized",
      count: c.count,
    }));

    return Response.json({
      success: true,
      artworks: artworksWithRealStats,
      metrics: {
        totalCount,
        publishedCount,
        unpublishedCount,
        totalViews,
        totalLikes,
        topCategories,
      },
    });
  } catch (error) {
    console.error("Admin Artworks GET Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
