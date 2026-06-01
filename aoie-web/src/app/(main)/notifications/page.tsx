import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Notification from "@/models/Notification";

import NotificationItem from "@/components/notifications/NotificationItem";

export default async function NotificationsPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const notifications =
    await Notification.find({
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
      .lean();

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
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map(
            (notification: any) => (
              <NotificationItem
                key={
                  notification._id.toString()
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