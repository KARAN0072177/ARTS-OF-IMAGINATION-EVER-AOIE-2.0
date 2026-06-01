import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Comment from "@/models/Comment";
import CommentLike from "@/models/CommentLike";

import { createNotification }
  from "@/lib/createNotification";
import { emitNotification } from "@/lib/emitNotification";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  req: Request,
  { params }: RouteProps
) {
  try {
    const { id } = await params;
    const session =
      await getServerSession(
        authOptions
      );

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

    const commentIds = comments.map(
      (comment) => comment._id
    );

    const replies =
      commentIds.length > 0
        ? await Comment.find({
          artwork: id,
          parentComment: {
            $in: commentIds,
          },
        })
          .populate(
            "user",
            "username role artistProfile"
          )
          .sort({
            createdAt: 1,
          })
          .lean()
        : [];

    const allCommentIds = [
      ...commentIds,
      ...replies.map((reply) => reply._id),
    ];

    const likedComments =
      session?.user?.id &&
        allCommentIds.length > 0
        ? await CommentLike.find({
          user: session.user.id,
          comment: {
            $in: allCommentIds,
          },
        })
          .select("comment")
          .lean()
        : [];

    const likedSet = new Set(
      likedComments.map((like) =>
        like.comment.toString()
      )
    );

    const likeCounts =
      allCommentIds.length > 0
        ? await CommentLike.aggregate([
          {
            $match: {
              comment: {
                $in: allCommentIds,
              },
            },
          },
          {
            $group: {
              _id: "$comment",
              count: {
                $sum: 1,
              },
            },
          },
        ])
        : [];

    const likeCountMap = new Map(
      likeCounts.map((item) => [
        item._id.toString(),
        item.count,
      ])
    );

    const commentsWithReplies =
      comments.map((comment) => {
        const commentId =
          comment._id.toString();
        const commentReplies =
          replies.filter(
            (reply) =>
              reply.parentComment?.toString() ===
              comment._id.toString()
          );

        return {
          ...comment,
          likesCount:
            likeCountMap.get(commentId) ??
            comment.likesCount ?? 0,
          isLiked: likedSet.has(
            commentId
          ),
          replies: commentReplies.map(
            (reply) => {
              const replyId =
                reply._id.toString();

              return {
                ...reply,
                likesCount:
                  likeCountMap.get(replyId) ??
                  reply.likesCount ??
                  0,
                isLiked: likedSet.has(
                  replyId
                ),
              };
            }
          ),
        };
      });

    return Response.json({
      success: true,
      comments: commentsWithReplies,
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

    const parentCommentId =
      body.parentCommentId;

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

    let parentComment = null;

    if (parentCommentId) {
      parentComment =
        await Comment.findOne({
          _id: parentCommentId,
          artwork: id,
        });

      if (!parentComment) {
        return Response.json(
          {
            success: false,
            message:
              "Parent comment not found",
          },
          {
            status: 404,
          }
        );
      }
    }

    const rootParentCommentId =
      parentComment?.parentComment ||
      parentComment?._id ||
      null;

      // comment

    const comment =
      await Comment.create({
        artwork: id,
        user: session.user.id,
        content,
        parentComment:
          rootParentCommentId,
      });

    if (parentComment) {
      const notification =
        await createNotification({
        recipient:
          parentComment.user.toString(),

        sender:
          session.user.id,

        type: "comment_reply",

        artwork: id,

        comment:
          comment._id.toString(),
      });

      if (notification) {
        await emitNotification({
          recipientId:
            parentComment.user.toString(),

          notification: {
            type: "comment_reply",
            senderId:
              session.user.id,
            artworkId: id,
            commentId:
              comment._id.toString(),
          },
        });
      }
    }

    // comment notification

    const notification =
      await createNotification({
      recipient:
        artwork.artist.toString(),

      sender:
        session.user.id,

      type: "artwork_comment",

      artwork: id,

      comment:
        comment._id.toString(),
    });

    if (notification) {
      await emitNotification({
        recipientId:
          artwork.artist.toString(),

        notification: {
          type: "artwork_comment",
          senderId:
            session.user.id,
          artworkId: id,
          commentId:
            comment._id.toString(),
        },
      });
    }

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
        comment: {
          ...populatedComment,
          likesCount: 0,
          isLiked: false,
          replies: [],
        },
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
