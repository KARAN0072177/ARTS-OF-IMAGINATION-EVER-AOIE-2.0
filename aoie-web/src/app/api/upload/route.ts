import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { s3Client } from "@/lib/aws";

import crypto from "crypto";

export async function POST(
  req: Request
) {
  try {
    const formData =
      await req.formData();

    const file =
      formData.get(
        "file"
      ) as File | null;

    if (!file) {
      return Response.json(
        {
          success: false,
          message:
            "No file uploaded",
        },
        { status: 400 }
      );
    }

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    const fileExtension =
      file.name.split(".").pop();

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    const key =
      `artworks/${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket:
          process.env
            .AWS_BUCKET_NAME,

        Key: key,

        Body: buffer,

        ContentType:
          file.type,
      })
    );

    const imageUrl =
      `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return Response.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          "Upload failed",
      },
      { status: 500 }
    );
  }
}