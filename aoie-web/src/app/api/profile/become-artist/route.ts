import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

export async function POST() {
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
      );

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.role === "artist") {
      return Response.json(
        {
          success: false,
          message:
            "Account is already an artist account",
        },
        { status: 400 }
      );
    }

    user.role = "artist";

    user.artistProfile = {
      displayName:
        user.username,

      bio: "",

      website: "",

      location: "",

      avatar: "",

      banner: "",

      isArtistProfileComplete:
        false,
    };

    await user.save();

    return Response.json({
      success: true,
      message:
        "Artist account activated successfully",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      { status: 500 }
    );
  }
}