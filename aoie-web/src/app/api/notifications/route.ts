import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Notification from "@/models/Notification";

export async function GET() {
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
        .limit(50)
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