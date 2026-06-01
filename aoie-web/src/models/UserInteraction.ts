import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export type InteractionType =
  | "view"
  | "like"
  | "comment"
  | "save";

export interface IUserInteraction
  extends Document {
  user?: Types.ObjectId;
  artwork: Types.ObjectId;
  type: InteractionType;
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
          "like",
          "comment",
          "save",
        ],
        required: true,
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
        required: true,
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
  type: 1,
});

const UserInteraction: Model<IUserInteraction> =
  mongoose.models.UserInteraction ||
  mongoose.model<IUserInteraction>(
    "UserInteraction",
    UserInteractionSchema
  );

export default UserInteraction;
