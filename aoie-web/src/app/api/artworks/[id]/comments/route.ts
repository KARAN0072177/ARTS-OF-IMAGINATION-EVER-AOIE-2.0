import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Comment from "@/models/Comment";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET COMMENTS
 */
export async function GET(
  req: Request,
  { params }: RouteProps
) {
  try {
    const { id } = await params;

    await connectDB();

    const artwork =
      await Artwork.findById(id);

    if (!artwork) {
      return Response.json(
        {
          success: false,
          message: "Artwork not found",
        },
        {
          status: 404,
        }
      );
    }

    const comments =
      await Comment.find({
        artwork: id,
        parentComment: null,
      })
        .populate(
          "user",
          "username role artistProfile"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return Response.json({
      success: true,
      comments,
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

/**
 * CREATE COMMENT
 */
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

    const artwork =
      await Artwork.findById(id);

    if (!artwork) {
      return Response.json(
        {
          success: false,
          message: "Artwork not found",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await req.json();

    const content =
      body.content?.trim();

    if (!content) {
      return Response.json(
        {
          success: false,
          message:
            "Comment content is required",
        },
        {
          status: 400,
        }
      );
    }

    if (content.length > 1000) {
      return Response.json(
        {
          success: false,
          message:
            "Comment is too long",
        },
        {
          status: 400,
        }
      );
    }

    const comment =
      await Comment.create({
        artwork: id,

        user:
          session.user.id,

        content,

        parentComment: null,
      });

    const populatedComment =
      await Comment.findById(
        comment._id
      )
        .populate(
          "user",
          "username role artistProfile"
        )
        .lean();

    return Response.json(
      {
        success: true,

        comment:
          populatedComment,
      },
      {
        status: 201,
      }
    );
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