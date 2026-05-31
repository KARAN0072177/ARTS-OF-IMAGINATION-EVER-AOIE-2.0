import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface ILike
  extends Document {
  user: Types.ObjectId;

  artwork: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema =
  new Schema<ILike>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      artwork: {
        type: Schema.Types.ObjectId,
        ref: "Artwork",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * Prevent duplicate likes:
 * One user can like one artwork only once.
 */
LikeSchema.index(
  {
    user: 1,
    artwork: 1,
  },
  {
    unique: true,
  }
);

const Like: Model<ILike> =
  mongoose.models.Like ||
  mongoose.model<ILike>(
    "Like",
    LikeSchema
  );

export default Like;