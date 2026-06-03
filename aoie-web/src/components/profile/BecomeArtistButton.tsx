import Link from "next/link";
import { BadgeCheck, Clock, XCircle } from "lucide-react";

export default function BecomeArtistButton({
  status = "none",
}: {
  status?: "none" | "pending" | "approved" | "rejected";
}) {
  if (status === "pending") {
    return (
      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Artist application pending
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/profile/become-artist"
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
        status === "rejected"
          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "bg-slate-950 text-white hover:bg-slate-800"
      }`}
    >
      {status === "rejected" ? (
        <XCircle className="h-4 w-4" />
      ) : (
        <BadgeCheck className="h-4 w-4" />
      )}
      {status === "rejected"
        ? "Update artist application"
        : "Apply to become an artist"}
    </Link>
  );
}
