import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { s3Client } from "@/lib/aws";

import crypto from "crypto";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const maxFileSize = 10 * 1024 * 1024;
const maxFiles = 5;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File)
      .slice(0, maxFiles);

    if (files.length < 2) {
      return Response.json(
        {
          success: false,
          message: "Please upload at least 2 sample images.",
        },
        { status: 400 }
      );
    }

    const imageUrls: string[] = [];

    for (const file of files) {
      if (!allowedImageTypes.includes(file.type)) {
        return Response.json(
          {
            success: false,
            message:
              "Sample images must be JPG, PNG, WEBP, or GIF files.",
          },
          { status: 400 }
        );
      }

      if (file.size > maxFileSize) {
        return Response.json(
          {
            success: false,
            message: "Each sample image must be 10MB or smaller.",
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { checkImageSafety } = await import("@/lib/checkImageSafety");
      const safetyResult = await checkImageSafety(buffer, {
        userId: session.user.id,
        route: "/api/artist-applications/samples",
      });

      if (!safetyResult.safe) {
        return Response.json(
          {
            success: false,
            flagged: true,
            category: safetyResult.category,
            message: safetyResult.message,
          },
          { status: 400 }
        );
      }

      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() ||
        file.type.split("/")[1] ||
        "jpg";
      const key = `artist-applications/${session.user.id}/${crypto.randomUUID()}.${fileExtension}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );

      imageUrls.push(
        `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      );
    }

    return Response.json({
      success: true,
      imageUrls,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Sample upload failed" },
      { status: 500 }
    );
  }
}
