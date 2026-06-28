import { connectDB } from "@/lib/db";
import User from "@/models/User";

import bcrypt from "bcryptjs";
import crypto from "crypto";

import { sendVerificationEmail } from "@/lib/sendVerificationEmail";
import { logPlatformActivity } from "@/lib/telemetry";

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
      username,
      token: verificationToken,
    });

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    logPlatformActivity({
      category: "AUTH",
      severity: "INFO",
      eventType: "USER_REGISTERED",
      actor: {
        userId: user._id,
        username: user.username || "",
        email: user.email,
        ipAddress: ip,
        userAgent,
      },
      details: {
        route: "/api/auth",
        method: "POST",
      },
    }).catch((err) => console.error("Telemetry Register Error:", err));

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
