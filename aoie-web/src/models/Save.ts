import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface ISave
  extends Document {
  user: Types.ObjectId;

  artwork: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const SaveSchema =
  new Schema<ISave>(
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
 * One user can save
 * one artwork only once.
 */
SaveSchema.index(
  {
    user: 1,
    artwork: 1,
  },
  {
    unique: true,
  }
);

/**
 * Faster queries:
 * User's saved artworks
 */
SaveSchema.index({
  user: 1,
  createdAt: -1,
});

/**
 * Future analytics:
 * Who saved this artwork
 */
SaveSchema.index({
  artwork: 1,
});

const Save: Model<ISave> =
  mongoose.models.Save ||
  mongoose.model<ISave>(
    "Save",
    SaveSchema
  );

export default Save;