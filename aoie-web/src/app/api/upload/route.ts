import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { s3Client } from "@/lib/aws";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

import crypto from "crypto";
import sharp from "sharp";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const maxFileSize = 10 * 1024 * 1024;

export async function POST(
  req: Request
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user =
      await User.findById(
        session.user.id
      ).select("role");

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.role !== "artist") {
      return Response.json(
        {
          success: false,
          message:
            "Activate your artist account before uploading images",
        },
        { status: 403 }
      );
    }

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

    if (!allowedImageTypes.includes(file.type)) {
      return Response.json(
        {
          success: false,
          message:
            "Please upload a JPG, PNG, WEBP, or GIF image.",
        },
        { status: 400 }
      );
    }

    if (file.size > maxFileSize) {
      return Response.json(
        {
          success: false,
          message:
            "Image must be 10MB or smaller.",
        },
        { status: 400 }
      );
    }

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    let placeholderUrl = "";
    try {
      const lowResBuffer = await sharp(buffer)
        .resize(32, 32, { fit: "inside" })
        .jpeg({ quality: 70 })
        .toBuffer();
      placeholderUrl = `data:image/jpeg;base64,${lowResBuffer.toString("base64")}`;
    } catch (e) {
      console.error("Failed to generate base64 image placeholder", e);
    }

    const fileExtension =
      file.name.split(".").pop()?.toLowerCase() ||
      file.type.split("/")[1] ||
      "jpg";

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
      placeholderUrl,
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
