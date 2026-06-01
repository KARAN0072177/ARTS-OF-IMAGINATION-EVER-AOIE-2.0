import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { recordInteraction } from "@/lib/recordInteraction";

export async function POST(req: Request) {
  try {
    const session =
      await getServerSession(authOptions);
    const body = await req.json();
    const artworkId =
      typeof body.artworkId === "string"
        ? body.artworkId
        : "";

    if (!Types.ObjectId.isValid(artworkId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid artwork id",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    await recordInteraction({
      userId: session?.user?.id,
      artworkId,
      type: "view",
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
