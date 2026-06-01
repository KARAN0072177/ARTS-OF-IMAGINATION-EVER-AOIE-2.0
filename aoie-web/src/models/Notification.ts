import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export type NotificationType =
  | "follow"
  | "artwork_like"
  | "artwork_comment"
  | "comment_reply"
  | "comment_like";

export interface INotification
  extends Document {
  recipient: Types.ObjectId;

  sender: Types.ObjectId;

  type: NotificationType;

  artwork?: Types.ObjectId;

  comment?: Types.ObjectId;

  isRead: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema =
  new Schema<INotification>(
    {
      recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      type: {
        type: String,
        enum: [
          "follow",

          "artwork_like",

          "artwork_comment",

          "comment_reply",

          "comment_like",
        ],
        required: true,
      },

      artwork: {
        type: Schema.Types.ObjectId,
        ref: "Artwork",
      },

      comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },

      isRead: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * Main notification query:
 * Get notifications for user
 */
NotificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

/**
 * Fast unread count
 */
NotificationSchema.index({
  recipient: 1,
  isRead: 1,
});

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>(
    "Notification",
    NotificationSchema
  );

export default Notification;