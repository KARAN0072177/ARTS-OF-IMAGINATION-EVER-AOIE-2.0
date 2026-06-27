import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
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

    const [artworksRaw, totalCount, publishedCount, unpublishedCount, engagementAgg, topCategoriesRaw] =
      await Promise.all([
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
      ]);

    const totalViews = engagementAgg[0]?.totalViews || 0;
    const totalLikes = engagementAgg[0]?.totalLikes || 0;

    const topCategories = topCategoriesRaw.map((c) => ({
      category: c._id || "Uncategorized",
      count: c.count,
    }));

    return Response.json({
      success: true,
      artworks: artworksRaw,
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
