import Artwork from "@/models/Artwork";
import UserInteraction from "@/models/UserInteraction";

export type InteractionType =
  | "view"
  | "click"
  | "like"
  | "save"
  | "comment"
  | "share"
  | "download";

const interactionWeights: Record<
  InteractionType,
  number
> = {
  view: 1,
  click: 2,
  like: 5,
  save: 6,
  comment: 4,
  share: 8,
  download: 10,
};

interface RecordInteractionInput {
  userId: string;
  artworkId: string;
  type?: InteractionType;
}

export async function recordInteraction({
  userId,
  artworkId,
  type = "view",
}: RecordInteractionInput) {
  const artwork = await Artwork.findById(
    artworkId
  )
    .select("category tags")
    .lean();

  if (!artwork) {
    return null;
  }

  if (type === "view") {
    await Artwork.findByIdAndUpdate(artworkId, {
      $inc: { views: 1 },
    });
  }

  return UserInteraction.create({
    user: userId,
    artwork: artworkId,
    type,
    category: artwork.category,
    tags: artwork.tags || [],
    weight: interactionWeights[type],
  });
}
