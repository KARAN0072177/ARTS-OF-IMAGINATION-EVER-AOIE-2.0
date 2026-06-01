import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Notification from "@/models/Notification";
import User from "@/models/User";

void Artwork;
void User;

export async function GET(req: Request) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const { searchParams } =
      new URL(req.url);

    const requestedLimit = Number(
      searchParams.get("limit")
    );

    const limit = Number.isFinite(
      requestedLimit
    )
      ? Math.min(
          Math.max(requestedLimit, 1),
          50
        )
      : 50;

    const notifications =
      await Notification.find({
        recipient:
          session.user.id,
      })
        .populate(
          "sender",
          "username artistProfile"
        )
        .populate(
          "artwork",
          "title"
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    const unreadCount =
      await Notification.countDocuments(
        {
          recipient:
            session.user.id,

          isRead: false,
        }
      );

    return Response.json({
      success: true,

      notifications,

      unreadCount,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
