"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Heart,
  MessageCircle,
  Reply,
  UserPlus,
} from "lucide-react";

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
      avatar?: string;
    };
  };
  artwork?: {
    _id: string;
    title?: string;
    imageUrl?: string;
  };
}

interface NotificationItemProps {
  notification: NotificationListItem;
  compact?: boolean;
}

export default function NotificationItem({
    notification,
    compact = false,
}: NotificationItemProps) {
  const sender =
    notification.sender?.artistProfile
      ?.displayName ||
    notification.sender?.username ||
    "Someone";

  let action = "";
  let href = "/notifications";
  let Icon = AtSign;
  let accentClass =
    "bg-slate-100 text-slate-600";

  switch (notification.type) {
    case "follow":
      action = "followed you";
      Icon = UserPlus;
      accentClass =
        "bg-cyan-50 text-cyan-700";

      href = notification.sender?.username
        ? `/artist/${notification.sender.username}`
        : "/notifications";
      break;

    case "artwork_like":
      action = "liked your artwork";
      Icon = Heart;
      accentClass =
        "bg-rose-50 text-rose-600";

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    case "artwork_comment":
      action = "commented on your artwork";
      Icon = MessageCircle;
      accentClass =
        "bg-emerald-50 text-emerald-700";

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    case "comment_reply":
      action = "replied to your comment";
      Icon = Reply;
      accentClass =
        "bg-violet-50 text-violet-700";

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    case "comment_like":
      action = "liked your comment";
      Icon = Heart;
      accentClass =
        "bg-rose-50 text-rose-600";

      href = notification.artwork?._id
        ? `/artwork/${notification.artwork._id}`
        : "/notifications";
      break;

    default:
      action = "sent you a notification";
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

  const createdAt = new Date(
    notification.createdAt
  );
  const timeLabel =
    Number.isNaN(createdAt.getTime())
      ? ""
      : createdAt.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  const avatar =
    notification.sender?.artistProfile
      ?.avatar || "";
  const initial =
    sender.trim().charAt(0).toUpperCase() ||
    "A";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
        !notification.isRead
          ? "bg-cyan-50/55"
          : ""
      }`}
    >
      <div className="relative shrink-0">
        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-slate-950 text-white">
          {avatar ? (
            <Image
              src={avatar}
              alt={sender}
              fill
              sizes="44px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold">
              {initial}
            </span>
          )}
        </div>
        <span
          className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${accentClass}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-slate-700">
          <span className="font-bold text-slate-950">
            {sender}
          </span>{" "}
          {action}
          {notification.artwork?.title && (
            <>
              {" "}
              <span className="font-semibold text-slate-950">
                {notification.artwork.title}
              </span>
            </>
          )}
        </p>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
          )}
          <span>{timeLabel}</span>
        </div>
      </div>

      {notification.artwork?.imageUrl && !compact && (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={notification.artwork.imageUrl}
            alt={
              notification.artwork.title ||
              "Artwork"
            }
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
    </button>
  );
}
