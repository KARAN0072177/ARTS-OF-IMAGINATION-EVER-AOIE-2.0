import {
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { s3Client } from "@/lib/aws";

export async function deleteArtworkAsset(
  imageUrl: string
) {
  try {
    const url = new URL(imageUrl);
    const key = decodeURIComponent(
      url.pathname.replace(/^\//, "")
    );

    if (!key) return;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Failed to delete artwork asset", error);
  }
}
