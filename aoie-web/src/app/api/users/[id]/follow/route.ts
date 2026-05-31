import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Follow from "@/models/Follow";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  req: Request,
  { params }: RouteProps
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

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

    const { id } = await params;

    await connectDB();

    const targetUser =
      await User.findById(id);

    if (!targetUser) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // Prevent self follow
    if (
      session.user.id === id
    ) {
      return Response.json(
        {
          success: false,
          message:
            "You cannot follow yourself",
        },
        {
          status: 400,
        }
      );
    }

    const existingFollow =
      await Follow.findOne({
        follower:
          session.user.id,

        following: id,
      });

    // Unfollow
    if (existingFollow) {
      await Follow.deleteOne({
        _id:
          existingFollow._id,
      });

      const followersCount =
        await Follow.countDocuments(
          {
            following: id,
          }
        );

      return Response.json({
        success: true,
        following: false,
        followersCount,
      });
    }

    // Follow
    await Follow.create({
      follower:
        session.user.id,

      following: id,
    });

    const followersCount =
      await Follow.countDocuments(
        {
          following: id,
        }
      );

    return Response.json({
      success: true,
      following: true,
      followersCount,
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