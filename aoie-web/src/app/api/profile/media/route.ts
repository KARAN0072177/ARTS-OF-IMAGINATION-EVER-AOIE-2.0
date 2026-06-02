import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "@/lib/auth";
import { s3Client } from "@/lib/aws";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getExtension(file: File) {
  const extension =
    file.name.split(".").pop() || "jpg";

  return extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export async function POST(req: Request) {
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

    const user = await User.findById(
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
            "Activate your artist account before adding profile media.",
        },
        { status: 403 }
      );
    }

    const formData =
      await req.formData();
    const file =
      formData.get("file") as File | null;
    const type =
      formData.get("type");

    if (
      type !== "avatar" &&
      type !== "banner"
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Profile media type must be avatar or banner.",
        },
        { status: 400 }
      );
    }

    if (!file) {
      return Response.json(
        {
          success: false,
          message: "No file uploaded",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        {
          success: false,
          message:
            "Upload a JPG, PNG, WEBP, or GIF image.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message:
            "Profile media must be 5MB or smaller.",
        },
        { status: 400 }
      );
    }

    const bytes =
      await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = getExtension(file);
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const key = `profiles/${session.user.id}/${type}/${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket:
          process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const imageUrl =
      `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return Response.json({
      success: true,
      imageUrl,
      key,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Profile media upload failed",
      },
      { status: 500 }
    );
  }
}
