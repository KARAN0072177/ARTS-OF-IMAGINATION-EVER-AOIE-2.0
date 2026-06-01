import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface ICommentLike
  extends Document {
  user: Types.ObjectId;

  comment: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const CommentLikeSchema =
  new Schema<ICommentLike>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

CommentLikeSchema.index(
  {
    user: 1,
    comment: 1,
  },
  {
    unique: true,
  }
);

const CommentLike: Model<ICommentLike> =
  mongoose.models.CommentLike ||
  mongoose.model<ICommentLike>(
    "CommentLike",
    CommentLikeSchema
  );

export default CommentLike;
