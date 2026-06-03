import ArtworkCard from "@/components/artwork/ArtworkCard";

interface TrendingArtwork {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  artistUsername?: string;
  artistName?: string;
  artistAvatar?: string;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

interface TrendingSectionProps {
  artworks: TrendingArtwork[];
}

export default function TrendingSection({
  artworks,
}: TrendingSectionProps) {
  if (artworks.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Trending
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Trending now
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Popular this week from views,
            likes, saves, shares, and
            downloads.
          </p>
        </div>
      </div>

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {artworks.map((artwork) => (
          <div
            key={artwork.id}
            className="w-44 shrink-0 sm:w-56"
          >
            <ArtworkCard
              id={artwork.id}
              title={artwork.title}
              imageUrl={artwork.imageUrl}
              category={artwork.category}
              artistUsername={
                artwork.artistUsername
              }
              artistName={artwork.artistName}
              artistAvatar={
                artwork.artistAvatar
              }
              likesCount={artwork.likesCount}
              isLiked={artwork.isLiked}
              isSaved={artwork.isSaved}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
