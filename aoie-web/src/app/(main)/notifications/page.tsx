import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Notification from "@/models/Notification";

import NotificationItem, {
  NotificationListItem,
} from "@/components/notifications/NotificationItem";

interface RawNotification {
  _id: {
    toString(): string;
  };
  type: NotificationListItem["type"];
  isRead: boolean;
  createdAt: Date;
  sender?: {
    username?: string;
    artistProfile?: {
      displayName?: string;
    };
  } | null;
  artwork?: {
    _id: {
      toString(): string;
    };
  } | null;
}

function serializeNotification(
  notification: RawNotification
): NotificationListItem {
  return {
    _id: notification._id.toString(),
    type: notification.type,
    isRead: notification.isRead,
    createdAt:
      notification.createdAt.toISOString(),
    sender: notification.sender
      ? {
          username:
            notification.sender.username || "",
          artistProfile:
            notification.sender.artistProfile,
        }
      : undefined,
    artwork: notification.artwork
      ? {
          _id: notification.artwork._id.toString(),
        }
      : undefined,
  };
}

export default async function NotificationsPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const notifications = (await Notification.find({
      recipient:
        session.user.id,
    })
      .populate(
        "sender",
        "username artistProfile"
      )
      .populate(
        "artwork",
        "title"
      )
      .sort({
        createdAt: -1,
      })
      .lean()) as unknown as RawNotification[];

  const notificationItems =
    notifications.map(
      serializeNotification
    );

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Notifications
        </h1>

        <p className="mt-2 text-slate-500">
          Stay updated with activity
          across your account.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {notificationItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notificationItems.map(
            (notification) => (
              <NotificationItem
                key={
                  notification._id
                }
                notification={
                  notification
                }
              />
            )
          )
        )}
      </div>
    </section>
  );
}
