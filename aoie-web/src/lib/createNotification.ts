import Notification, {
  NotificationType,
} from "@/models/Notification";

interface CreateNotificationParams {
  recipient: string;

  sender: string;

  type: NotificationType;

  artwork?: string;

  comment?: string;
}

export async function createNotification({
  recipient,
  sender,
  type,
  artwork,
  comment,
}: CreateNotificationParams) {
  try {
    // Prevent self notifications
    if (recipient === sender) {
      return null;
    }

    return await Notification.create({
      recipient,
      sender,
      type,
      artwork,
      comment,
    });
  } catch (error) {
    console.error(
      "Notification Error:",
      error
    );

    return null;
  }
}