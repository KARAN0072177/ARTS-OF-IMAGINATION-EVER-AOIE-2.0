import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IModerationAction {
  action: "warned" | "suspended" | "dismissed";
  admin: Types.ObjectId;
  adminNote: string;
  timestamp: Date;
  emailTemplate?: string;
}

export interface IModerationLog extends Document {
  user: Types.ObjectId;
  route: string;
  label: string;
  parentCategory: string;
  confidence: number;
  appliedThreshold: number;
  fileSize: number;
  fileType: string;
  provider: string;
  providerVersion: string;
  decision: string;
  reviewStatus: "pending" | "reviewed" | "dismissed";
  enforcementAction: "warned" | "suspended" | null;
  actions: IModerationAction[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationActionSchema = new Schema<IModerationAction>({
  action: {
    type: String,
    enum: ["warned", "suspended", "dismissed"],
    required: true,
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  adminNote: {
    type: String,
    default: "",
    maxlength: 800,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  emailTemplate: {
    type: String,
    default: "",
  },
});

const ModerationLogSchema = new Schema<IModerationLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    route: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    parentCategory: {
      type: String,
      default: "",
    },
    confidence: {
      type: Number,
      required: true,
    },
    appliedThreshold: {
      type: Number,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "aws-rekognition",
    },
    providerVersion: {
      type: String,
      default: "2026-06",
    },
    decision: {
      type: String,
      default: "auto-rejected",
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
      index: true,
    },
    enforcementAction: {
      type: String,
      enum: [null, "warned", "suspended"],
      default: null,
    },
    actions: {
      type: [ModerationActionSchema],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index: automatically clear moderation logs after 365 days
ModerationLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ModerationLogSchema.index({ createdAt: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.ModerationLog) {
  delete mongoose.models.ModerationLog;
}

const ModerationLog: Model<IModerationLog> =
  mongoose.models.ModerationLog ||
  mongoose.model<IModerationLog>("ModerationLog", ModerationLogSchema);

export default ModerationLog;
