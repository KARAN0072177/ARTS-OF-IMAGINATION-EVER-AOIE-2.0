import { connectDB } from "@/lib/db";
import User from "@/models/User";

import bcrypt from "bcryptjs";
import crypto from "crypto";

import { sendVerificationEmail } from "@/lib/sendVerificationEmail";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { username, email, password } = body;

    if (!username || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ],
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const verificationToken =
      crypto.randomUUID();

    const verificationTokenExpiry =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000
      );

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",

      isVerified: false,

      verificationToken,
      verificationTokenExpiry,
    });

    await sendVerificationEmail({
      email: user.email,
      username: user.username,
      token: verificationToken,
    });

    return Response.json(
      {
        success: true,
        email: user.email,
        message:
          "Verification email sent. Please check your inbox.",
      },
      { status: 201 }
    );
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
}
