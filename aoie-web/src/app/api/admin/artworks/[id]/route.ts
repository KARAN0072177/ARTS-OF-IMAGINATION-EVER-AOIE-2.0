import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: Request, { params }: RouteProps) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "admin" ||
      session.user.role === "super-admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid artwork ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    await connectDB();

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return Response.json(
        { success: false, message: "Artwork not found" },
        { status: 404 }
      );
    }

    if (typeof body.isPublished === "boolean") {
      artwork.isPublished = body.isPublished;
    }

    await artwork.save();

    return Response.json({
      success: true,
      message: artwork.isPublished
        ? "Artwork republished and restored to public feeds."
        : "Artwork delisted and hidden from public feeds.",
      artwork,
    });
  } catch (error) {
    console.error("Admin Artwork PATCH Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteProps) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "admin" ||
      session.user.role === "super-admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid artwork ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const artwork = await Artwork.findByIdAndDelete(id);
    if (!artwork) {
      return Response.json(
        { success: false, message: "Artwork not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Artwork record permanently removed.",
    });
  } catch (error) {
    console.error("Admin Artwork DELETE Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
