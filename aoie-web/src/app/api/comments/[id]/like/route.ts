import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { createNotification } from "@/lib/createNotification";

import Comment from "@/models/Comment";
import CommentLike from "@/models/CommentLike";

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

    const comment =
      await Comment.findById(id);

    if (!comment) {
      return Response.json(
        {
          success: false,
          message: "Comment not found",
        },
        {
          status: 404,
        }
      );
    }

    const existingLike =
      await CommentLike.findOne({
        user: session.user.id,
        comment: id,
      });

    if (existingLike) {
      await CommentLike.deleteOne({
        _id: existingLike._id,
      });

      const likesCount =
        await CommentLike.countDocuments({
          comment: id,
        });

      await Comment.findByIdAndUpdate(
        id,
        {
          likesCount,
        }
      );

      return Response.json({
        success: true,
        liked: false,
        likesCount,
      });
    }

    await CommentLike.create({
      user: session.user.id,
      comment: id,
    });

    await createNotification({
      recipient:
        comment.user.toString(),

      sender:
        session.user.id,

      type: "comment_like",

      comment:
        comment._id.toString(),
    });

    const likesCount =
      await CommentLike.countDocuments({
        comment: id,
      });

    await Comment.findByIdAndUpdate(
      id,
      {
        likesCount,
      }
    );

    return Response.json({
      success: true,
      liked: true,
      likesCount,
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
