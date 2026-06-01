import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IComment
  extends Document {
  artwork: Types.ObjectId;

  user: Types.ObjectId;

  content: string;

  parentComment?: Types.ObjectId | null;

  likesCount: number;

  isEdited: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema =
  new Schema<IComment>(
    {
      artwork: {
        type: Schema.Types.ObjectId,
        ref: "Artwork",
        required: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },

      parentComment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null,
      },

      likesCount: {
        type: Number,
        default: 0,
      },

      isEdited: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * Faster comment lookups per artwork
 */
CommentSchema.index({
  artwork: 1,
  createdAt: -1,
});

/**
 * Faster reply lookups
 */
CommentSchema.index({
  parentComment: 1,
});

const Comment: Model<IComment> =
  mongoose.models.Comment ||
  mongoose.model<IComment>(
    "Comment",
    CommentSchema
  );

export default Comment;
