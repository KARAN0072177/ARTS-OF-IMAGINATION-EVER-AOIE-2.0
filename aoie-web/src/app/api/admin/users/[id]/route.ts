import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const validRoles = [
  "user",
  "artist",
  "admin",
  "super-admin",
] as const;

type Role = (typeof validRoles)[number];

function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    validRoles.includes(value as Role)
  );
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "admin" ||
      session.user.role === "super-admin";

    if (!isAdmin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const role = body.role;
    const isVerified = body.isVerified;

    if (!isRole(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    if (typeof isVerified !== "boolean") {
      return NextResponse.json(
        { message: "Invalid verification status" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const currentAdminIsSuper =
      session.user.role === "super-admin";
    const targetIsAdminRole =
      user.role === "admin" ||
      user.role === "super-admin";
    const requestedAdminRole =
      role === "admin" || role === "super-admin";

    if (
      (targetIsAdminRole || requestedAdminRole) &&
      !currentAdminIsSuper
    ) {
      return NextResponse.json(
        {
          message:
            "Only super-admin can manage admin roles.",
        },
        { status: 403 }
      );
    }

    if (
      id === session.user.id &&
      user.role !== role
    ) {
      return NextResponse.json(
        {
          message:
            "You cannot change your own role from the active session.",
        },
        { status: 400 }
      );
    }

    user.role = role;
    user.isVerified = isVerified;

    if (role === "artist") {
      user.artistApplicationStatus = "approved";
    }

    if (role === "user") {
      user.artistApplicationStatus =
        user.artistApplicationStatus === "pending"
          ? "pending"
          : "none";
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        role: user.role,
        isVerified: user.isVerified,
        artistApplicationStatus:
          user.artistApplicationStatus,
      },
    });
  } catch (error) {
    console.error("Admin user update error:", error);

    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}
