import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPlatformLog extends Document {
  category: "SECURITY" | "MODERATION" | "AUTH" | "ADMIN_ACTION" | "INFRASTRUCTURE";
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
  eventType: string;
  actor: {
    userId?: Types.ObjectId;
    username?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  details: {
    route?: string;
    method?: string;
    attackVector?: string;
    payloadSnippet?: string;
    failureCount?: number;
    metadata?: Record<string, unknown>;
    changes?: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    };
  };
  isResolved: boolean;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformLogSchema = new Schema<IPlatformLog>(
  {
    category: {
      type: String,
      required: true,
      enum: ["SECURITY", "MODERATION", "AUTH", "ADMIN_ACTION", "INFRASTRUCTURE"],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["INFO", "WARNING", "CRITICAL", "EMERGENCY"],
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String, default: "" },
      email: { type: String, default: "" },
      ipAddress: { type: String, default: "unknown" },
      userAgent: { type: String, default: "unknown" },
    },
    details: {
      route: { type: String, default: "" },
      method: { type: String, default: "" },
      attackVector: { type: String, default: "" },
      payloadSnippet: { type: String, default: "" },
      failureCount: { type: Number, default: 0 },
      metadata: { type: Schema.Types.Mixed, default: {} },
      changes: { type: Schema.Types.Mixed, default: {} },
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

PlatformLogSchema.index({ createdAt: -1 });
PlatformLogSchema.index({ category: 1, severity: 1, createdAt: -1 });

const PlatformLog: Model<IPlatformLog> =
  mongoose.models.PlatformLog ||
  mongoose.model<IPlatformLog>("PlatformLog", PlatformLogSchema);

export default PlatformLog;
