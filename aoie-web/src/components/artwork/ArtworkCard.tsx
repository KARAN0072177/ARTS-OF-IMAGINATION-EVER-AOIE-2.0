import Link from "next/link";

interface ArtworkCardProps {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
}

export default function ArtworkCard({
  id,
  title,
  imageUrl,
  category,
}: ArtworkCardProps) {
  return (
    <Link
      href={`/artwork/${id}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-950 line-clamp-1">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {category}
        </p>
      </div>
    </Link>
  );
}