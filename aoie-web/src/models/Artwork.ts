import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IArtwork
  extends Document {
  artist: Types.ObjectId;

  title: string;

  description: string;

  imageUrl: string;

  category: string;

  tags: string[];

  views: number;

  likesCount: number;

  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ArtworkSchema =
  new Schema<IArtwork>(
    {
      artist: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      description: {
        type: String,
        default: "",
        maxlength: 2000,
      },

      imageUrl: {
        type: String,
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

      views: {
        type: Number,
        default: 0,
      },

      likesCount: {
        type: Number,
        default: 0,
      },

      isPublished: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const Artwork: Model<IArtwork> =
  mongoose.models.Artwork ||
  mongoose.model<IArtwork>(
    "Artwork",
    ArtworkSchema
  );

export default Artwork;