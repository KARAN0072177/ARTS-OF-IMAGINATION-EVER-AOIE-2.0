"use client";
import { useRouter } from "next/navigation";

export interface NotificationListItem {
  _id: string;
  type:
    | "follow"
    | "artwork_like"
    | "artwork_comment"
    | "comment_reply"
    | "comment_like";
  isRead: boolean;
  createdAt: string;
  sender?: {
    username: string;
    artistProfile?: {
      displayName?: string;
    };
  };
  artwork?: {
    _id: string;
  };
}

interface NotificationItemProps {
  notification: NotificationListItem;
}

export default function NotificationItem({
    notification,
}: NotificationItemProps) {
  const sender =
    notification.sender?.artistProfile
      ?.displayName ||
    notification.sender?.username ||
    "Someone";

  let message = "";
  let href = "/notifications";

  switch (notification.type) {
    case "follow":
      message = `${sender} followed you`;

      href = notification.sender?.username
        ? `/artist/${notification.sender.username}`
        : "/notifications";
      break;

    case "artwork_like":
      message = `${sender} liked your artwork`;

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    case "artwork_comment":
      message = `${sender} commented on your artwork`;

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    case "comment_reply":
      message = `${sender} replied to your comment`;

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    case "comment_like":
      message = `${sender} liked your comment`;

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    default:
      message = "New notification";
  }

  const router = useRouter();

  async function handleClick() {
    try {
      if (!notification.isRead) {
        await fetch(
          `/api/notifications/${notification._id}/read`,
          {
            method: "PATCH",
          }
        );
      }

      router.push(href);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
        !notification.isRead
          ? "bg-cyan-50/50"
          : ""
      }`}
    >
      <p className="text-sm font-medium text-slate-900">
        {message}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {new Date(
          notification.createdAt
        ).toLocaleString()}
      </p>
    </button>
  );
}
