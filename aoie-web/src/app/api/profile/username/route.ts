import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

const usernamePattern =
  /^[a-zA-Z0-9_]{3,20}$/;

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

    const body = await req.json();
    const username =
      typeof body.username === "string"
        ? body.username.trim()
        : "";

    if (!usernamePattern.test(username)) {
      return Response.json(
        {
          success: false,
          message:
            "Username must be 3-20 characters and can use letters, numbers, or underscores.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser =
      await User.findOne({
        username,
        _id: {
          $ne: session.user.id,
        },
      }).lean();

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message:
            "That username is already taken.",
        },
        { status: 409 }
      );
    }

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

    user.username = username;
    user.usernameSetupRequired = false;

    await user.save();

    return Response.json({
      success: true,
      username,
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
