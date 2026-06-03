import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { recordInteraction } from "@/lib/recordInteraction";

import Artwork from "@/models/Artwork";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

function getFileName(title: string) {
  const safeTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeTitle || "aoie-artwork"}.jpg`;
}

export async function GET(
  _req: Request,
  { params }: RouteProps
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid artwork id",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const artwork = await Artwork.findById(id)
      .select("title imageUrl")
      .lean();

    if (!artwork?.imageUrl) {
      return Response.json(
        {
          success: false,
          message: "Artwork not found",
        },
        { status: 404 }
      );
    }

    const imageResponse = await fetch(
      artwork.imageUrl
    );

    if (!imageResponse.ok) {
      return Response.json(
        {
          success: false,
          message: "Unable to download image",
        },
        { status: 502 }
      );
    }

    const session =
      await getServerSession(authOptions);

    if (session?.user?.id) {
      await recordInteraction({
        userId: session.user.id,
        artworkId: id,
        type: "download",
      });
    }

    const contentType =
      imageResponse.headers.get(
        "content-type"
      ) || "application/octet-stream";

    return new Response(
      imageResponse.body,
      {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${getFileName(
            artwork.title
          )}"`,
        },
      }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Download failed",
      },
      { status: 500 }
    );
  }
}
