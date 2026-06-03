import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import User from "@/models/User";
import { sendArtistApplicationReceivedEmail } from "@/lib/sendArtistApplicationEmail";

const allowedCategories = [
  "Digital Art",
  "Anime",
  "Fantasy",
  "Landscape",
  "Photography",
  "3D",
  "Pixel Art",
  "Other",
];

function normalizeList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim()
        : "";
    const bio =
      typeof body.bio === "string"
        ? body.bio.trim()
        : "";
    const location =
      typeof body.location === "string"
        ? body.location.trim()
        : "";
    const website =
      typeof body.website === "string"
        ? body.website.trim()
        : "";
    const categories = normalizeList(
      body.categories
    ).filter((category) =>
      allowedCategories.includes(category)
    );
    const sampleLinks = normalizeList(
      body.sampleLinks
    );
    const ownershipConfirmed =
      body.ownershipConfirmed === true;

    if (
      !displayName ||
      displayName.length > 60 ||
      bio.length < 40 ||
      bio.length > 800 ||
      !website ||
      website.length > 240 ||
      categories.length === 0 ||
      sampleLinks.length < 2 ||
      !ownershipConfirmed
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Please complete all required artist application fields.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(
      session.user.id
    );

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "artist") {
      return Response.json(
        {
          success: false,
          message: "Your artist account is already active.",
        },
        { status: 400 }
      );
    }

    const pendingApplication =
      await ArtistApplication.findOne({
        user: user._id,
        status: "pending",
      }).lean();

    if (pendingApplication) {
      return Response.json(
        {
          success: false,
          message:
            "You already have an artist application under review.",
        },
        { status: 409 }
      );
    }

    const application =
      await ArtistApplication.create({
        user: user._id,
        displayName,
        bio,
        location,
        website,
        categories,
        sampleLinks,
        ownershipConfirmed,
        status: "pending",
      });

    user.artistApplicationStatus = "pending";
    await user.save();

    await sendArtistApplicationReceivedEmail({
      email: user.email,
      username: user.username || displayName,
      displayName,
      bio,
      location,
      website,
      categories,
    });

    return Response.json(
      {
        success: true,
        application: {
          id: application._id.toString(),
          status: application.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
