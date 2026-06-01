import Link from "next/link";

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

      href = `/artwork/${notification.artwork?._id}`;
      break;

    case "artwork_comment":
      message = `${sender} commented on your artwork`;

      href = `/artwork/${notification.artwork?._id}`;
      break;

    case "comment_reply":
      message = `${sender} replied to your comment`;

      href = `/artwork/${notification.artwork?._id}`;
      break;

    case "comment_like":
      message = `${sender} liked your comment`;

      href = `/artwork/${notification.artwork?._id}`;
      break;

    default:
      message = "New notification";
  }

  return (
    <Link
      href={href}
      className={`block border-b border-slate-100 p-4 transition hover:bg-slate-50 ${
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
    </Link>
  );
}
