import Artwork from "@/models/Artwork";
import UserInteraction, {
  InteractionType,
} from "@/models/UserInteraction";

const interactionWeights: Record<
  InteractionType,
  number
> = {
  view: 1,
  like: 4,
  comment: 5,
  save: 6,
};

export async function recordInteraction({
  userId,
  artworkId,
  type,
}: {
  userId?: string;
  artworkId: string;
  type: InteractionType;
}) {
  try {
    const artwork =
      await Artwork.findById(artworkId)
        .select("category tags")
        .lean();

    if (!artwork) {
      return null;
    }

    return await UserInteraction.create({
      user: userId,
      artwork: artworkId,
      type,
      category: artwork.category,
      tags: artwork.tags || [],
      weight: interactionWeights[type],
    });
  } catch (error) {
    console.error(
      "Record Interaction Error:",
      error
    );

    return null;
  }
}
