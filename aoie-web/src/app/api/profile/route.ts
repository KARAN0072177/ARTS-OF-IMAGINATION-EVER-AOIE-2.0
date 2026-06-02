import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);

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

  const user = await User.findById(session.user.id)
    .select(
      "username email role isVerified artistProfile createdAt updatedAt"
    )
    .lean();

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "User not found",
      },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      artistProfile: user.artistProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

function cleanText(
  value: unknown,
  maxLength: number
) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function cleanUrl(value: unknown) {
  const url = cleanText(value, 500);

  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
}

export async function PUT(req: Request) {
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

    const body = await req.json();

    await connectDB();

    const user = await User.findById(
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

    if (user.role !== "artist") {
      return Response.json(
        {
          success: false,
          message:
            "Artist profile is only available for artist accounts.",
        },
        { status: 403 }
      );
    }

    const displayName = cleanText(
      body.displayName,
      60
    );
    const bio = cleanText(body.bio, 500);
    const location = cleanText(
      body.location,
      80
    );
    const website = cleanUrl(body.website);
    const avatar = cleanUrl(body.avatar);
    const banner = cleanUrl(body.banner);

    const hasRequiredProfile =
      Boolean(displayName) &&
      Boolean(bio);

    user.artistProfile = {
      displayName:
        displayName ||
        user.username ||
        "",
      bio,
      website,
      location,
      avatar,
      banner,
      isArtistProfileComplete:
        hasRequiredProfile,
    };

    await user.save();

    return Response.json({
      success: true,
      artistProfile: user.artistProfile,
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
