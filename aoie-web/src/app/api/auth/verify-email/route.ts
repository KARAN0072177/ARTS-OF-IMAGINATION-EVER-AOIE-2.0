import { connectDB } from "@/lib/db";
import User from "@/models/User";

import { redirect } from "next/navigation";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      return Response.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      verificationToken: token,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Verification token not found",
        },
        { status: 404 }
      );
    }

    if (
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    ) {
      return Response.json(
        {
          success: false,
          message: "Verification token expired",
        },
        { status: 400 }
      );
    }

    user.isVerified = true;

    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }

  redirect("/login");
}