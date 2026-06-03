import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Notification from "@/models/Notification";
import User from "@/models/User";
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton";

void Artwork;
void User;

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
      avatar?: string;
    };
  } | null;
  artwork?: {
    _id: {
      toString(): string;
    };
    title?: string;
    imageUrl?: string;
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
          title: notification.artwork.title || "",
          imageUrl:
            notification.artwork.imageUrl || "",
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
        "title imageUrl"
      )
      .sort({
        createdAt: -1,
      })
      .lean()) as unknown as RawNotification[];

  const notificationItems =
    notifications.map(
      serializeNotification
    );
  const unreadCount = notificationItems.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
              Activity inbox
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal">
              Notifications
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Track follows, likes, comments, and replies across your AOIE account.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-2xl font-bold text-slate-950">
                {unreadCount}
              </p>
              <p className="text-xs font-medium text-slate-500">
                unread
              </p>
            </div>
            {notificationItems.length > 0 && (
              <MarkAllReadButton />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {notificationItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <span className="text-2xl">0</span>
            </div>
            <h2 className="mt-5 text-2xl font-bold">
              No notifications yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              New activity from artists and viewers will appear here.
            </p>
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
