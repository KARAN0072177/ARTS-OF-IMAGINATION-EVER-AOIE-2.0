import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

export type ArtistApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface IArtistApplication
  extends Document {
  user: Types.ObjectId;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  categories: string[];
  sampleLinks: string[];
  ownershipConfirmed: boolean;
  status: ArtistApplicationStatus;
  adminNote: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistApplicationSchema =
  new Schema<IArtistApplication>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
      },

      bio: {
        type: String,
        required: true,
        trim: true,
        maxlength: 800,
      },

      location: {
        type: String,
        default: "",
        trim: true,
        maxlength: 80,
      },

      website: {
        type: String,
        required: true,
        trim: true,
        maxlength: 240,
      },

      categories: {
        type: [String],
        default: [],
      },

      sampleLinks: {
        type: [String],
        default: [],
      },

      ownershipConfirmed: {
        type: Boolean,
        required: true,
      },

      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },

      adminNote: {
        type: String,
        default: "",
        maxlength: 500,
      },

      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reviewedAt: Date,
    },
    {
      timestamps: true,
    }
  );

ArtistApplicationSchema.index({
  status: 1,
  createdAt: -1,
});

ArtistApplicationSchema.index({
  user: 1,
  createdAt: -1,
});

const ArtistApplication: Model<IArtistApplication> =
  mongoose.models.ArtistApplication ||
  mongoose.model<IArtistApplication>(
    "ArtistApplication",
    ArtistApplicationSchema
  );

export default ArtistApplication;
