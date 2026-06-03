import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

export type ArtworkReportStatus =
  | "pending"
  | "valid"
  | "invalid";

export interface IArtworkReport
  extends Document {
  artwork: Types.ObjectId;
  reporter: Types.ObjectId;
  artist: Types.ObjectId;
  reason: string;
  details: string;
  status: ArtworkReportStatus;
  adminNote: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  actionTaken: "none" | "artwork_removed";
  createdAt: Date;
  updatedAt: Date;
}

const ArtworkReportSchema =
  new Schema<IArtworkReport>(
    {
      artwork: {
        type: Schema.Types.ObjectId,
        ref: "Artwork",
        required: true,
      },

      reporter: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      artist: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
      },

      details: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },

      status: {
        type: String,
        enum: ["pending", "valid", "invalid"],
        default: "pending",
      },

      adminNote: {
        type: String,
        default: "",
        maxlength: 800,
      },

      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reviewedAt: Date,

      actionTaken: {
        type: String,
        enum: ["none", "artwork_removed"],
        default: "none",
      },
    },
    {
      timestamps: true,
    }
  );

ArtworkReportSchema.index({
  status: 1,
  createdAt: -1,
});

ArtworkReportSchema.index({
  artwork: 1,
  reporter: 1,
});

const ArtworkReport: Model<IArtworkReport> =
  mongoose.models.ArtworkReport ||
  mongoose.model<IArtworkReport>(
    "ArtworkReport",
    ArtworkReportSchema
  );

export default ArtworkReport;
