import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IFollow
  extends Document {
  follower: Types.ObjectId;

  following: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const FollowSchema =
  new Schema<IFollow>(
    {
      follower: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      following: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * One user can follow another user only once.
 */
FollowSchema.index(
  {
    follower: 1,
    following: 1,
  },
  {
    unique: true,
  }
);

const Follow: Model<IFollow> =
  mongoose.models.Follow ||
  mongoose.model<IFollow>(
    "Follow",
    FollowSchema
  );

export default Follow;