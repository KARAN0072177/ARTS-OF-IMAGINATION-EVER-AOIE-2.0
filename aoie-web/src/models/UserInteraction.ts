import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IUserInteraction
  extends Document {
  user: Types.ObjectId;
  artwork: Types.ObjectId;
  type:
    | "view"
    | "click"
    | "like"
    | "save"
    | "comment"
    | "share"
    | "download";
  category: string;
  tags: string[];
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserInteractionSchema =
  new Schema<IUserInteraction>(
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
      type: {
        type: String,
        enum: [
          "view",
          "click",
          "like",
          "save",
          "comment",
          "share",
          "download",
        ],
        default: "view",
      },
      category: {
        type: String,
        required: true,
      },
      tags: {
        type: [String],
        default: [],
      },
      weight: {
        type: Number,
        default: 1,
      },
    },
    {
      timestamps: true,
    }
  );

UserInteractionSchema.index({
  user: 1,
  createdAt: -1,
});

UserInteractionSchema.index({
  artwork: 1,
  createdAt: -1,
});

UserInteractionSchema.index({
  type: 1,
  createdAt: -1,
});

const UserInteraction: Model<IUserInteraction> =
  mongoose.models.UserInteraction ||
  mongoose.model<IUserInteraction>(
    "UserInteraction",
    UserInteractionSchema
  );

export default UserInteraction;
