import { connectDB } from "@/lib/db";
import User from "@/models/User";

import { redirect } from "next/navigation";

export async function GET(req: Request) {
  let redirectPath = "";

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      redirectPath =
        "/verify-email?status=invalid";
    } else {
      const user = await User.findOne({
        verificationToken: token,
      });

      if (!user) {
        redirectPath =
          "/verify-email?status=invalid";
      } else if (
        !user.verificationTokenExpiry ||
        user.verificationTokenExpiry <
          new Date()
      ) {
        redirectPath =
          "/verify-email?status=expired";
      } else {
        user.isVerified = true;

        user.verificationToken =
          undefined;
        user.verificationTokenExpiry =
          undefined;

        await user.save();

        redirectPath = `/verify-email?status=success&email=${encodeURIComponent(
          user.email
        )}`;
      }
    }

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

  redirect(redirectPath || "/login");
}
