import "@/lib/dns";
import { connectDB } from "@/lib/db";

export async function GET() {
  await connectDB();

  return Response.json({
    success: true,
    message: "Database connected",
  });
}