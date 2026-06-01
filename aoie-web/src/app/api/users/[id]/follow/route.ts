import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Follow from "@/models/Follow";

import { createNotification }
  from "@/lib/createNotification";
import { emitNotification } from "@/lib/emitNotification";

interface FollowListUser {
  _id: {
    toString(): string;
  };
  username: string;
  role: string;
  artistProfile?: {
    displayName?: string;
  };
}

interface PopulatedFollow {
  follower?: FollowListUser;
  following?: FollowListUser;
}

function isFollowListUser(
  user: FollowListUser | undefined
): user is FollowListUser {
  return Boolean(user);
}

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

    const notification =
      await createNotification({
        recipient: id,

        sender:
          session.user.id,

        type: "follow",
      });

    if (notification) {
      await emitNotification({
        recipientId: id,

        notification: {
          type: "follow",

          senderId:
            session.user.id,
        },
      });
    }

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

export async function GET(
  req: Request,
  { params }: RouteProps
) {
  try {
    const { id } = await params;

    await connectDB();

    const listType = new URL(
      req.url
    ).searchParams.get("list");

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

    const session =
      await getServerSession(
        authOptions
      );

    const followersCount =
      await Follow.countDocuments({
        following: id,
      });

    const followingCount =
      await Follow.countDocuments({
        follower: id,
      });

    let following = false;

    if (session?.user?.id) {
      const existingFollow =
        await Follow.findOne({
          follower:
            session.user.id,

          following: id,
        });

      following =
        !!existingFollow;
    }

    if (
      listType === "followers" ||
      listType === "following"
    ) {
      const followDocs =
        listType === "followers"
          ? await Follow.find({
            following: id,
          })
            .populate(
              "follower",
              "username role artistProfile"
            )
            .sort({ createdAt: -1 })
            .lean()
          : await Follow.find({
            follower: id,
          })
            .populate(
              "following",
              "username role artistProfile"
            )
            .sort({ createdAt: -1 })
            .lean();

      const users = (
        followDocs as unknown as PopulatedFollow[]
      )
        .map((follow) =>
          listType === "followers"
            ? follow.follower
            : follow.following
        )
        .filter(isFollowListUser)
        .map((user) => ({
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          displayName:
            user.artistProfile
              ?.displayName ||
            user.username,
        }));

      return Response.json({
        success: true,
        users,
        following,
        followersCount,
        followingCount,
      });
    }

    return Response.json({
      success: true,

      following,

      followersCount,

      followingCount,
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
