import FooterExperience, {
  FooterArtwork,
} from "@/components/layout/FooterExperience";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";

interface RawFooterArtwork {
  _id: {
    toString(): string;
  };
  title: string;
  imageUrl: string;
  category: string;
  likesCount?: number;
}

function serializeFooterArtwork(
  artwork: RawFooterArtwork | null
): FooterArtwork | null {
  if (!artwork) {
    return null;
  }

  return {
    id: artwork._id.toString(),
    title: artwork.title,
    imageUrl: artwork.imageUrl,
    category: artwork.category,
    likesCount: artwork.likesCount || 0,
  };
}

export default async function Footer() {
  await connectDB();

  const artwork =
    (await Artwork.findOne({
      isPublished: true,
    })
      .select(
        "title imageUrl category likesCount"
      )
      .sort({
        likesCount: -1,
        createdAt: -1,
      })
      .lean()) as unknown as RawFooterArtwork | null;

  return (
    <FooterExperience
      artwork={serializeFooterArtwork(
        artwork
      )}
    />
  );
}
