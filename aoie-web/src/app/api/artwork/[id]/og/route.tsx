import { ImageResponse } from "next/og";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Artwork from "@/models/Artwork";
import User from "@/models/User"; // Ensure User schema is registered for populate

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

function getAbsoluteImageUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return renderFallback("Invalid Artwork ID");
    }

    await connectDB();

    const artwork = await Artwork.findById(id)
      .populate("artist", "username artistProfile")
      .lean();

    if (!artwork) {
      return renderFallback("Artwork Not Found");
    }

    const artist = artwork.artist as any;
    const artistName = artist?.artistProfile?.displayName || artist?.username || "Anonymous Artist";
    const initials = artistName.substring(0, 2).toUpperCase();
    const avatarUrl = artist?.artistProfile?.avatar ? getAbsoluteImageUrl(artist.artistProfile.avatar) : "";

    const artworkImageUrl = getAbsoluteImageUrl(artwork.imageUrl);

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: 1200,
            height: 630,
            backgroundColor: "#0f172a",
          }}
        >
          {/* Left panel: Artwork preview */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: 680,
              height: 630,
              backgroundColor: "#090d16",
              borderRight: "1px solid #1e293b",
            }}
          >
            <img
              src={artworkImageUrl}
              alt={artwork.title}
              style={{
                width: 620,
                height: 570,
                objectFit: "contain",
                borderRadius: 12,
              }}
            />
          </div>

          {/* Right panel: Metadata card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 520,
              height: 630,
              backgroundColor: "#0f172a",
              padding: "60px 40px",
            }}
          >
            {/* Top row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  backgroundColor: "#06b6d4",
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: "bold",
                  padding: "6px 16px",
                  borderRadius: 9999,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {artwork.category}
              </span>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  fontWeight: "bold",
                  letterSpacing: "0.2em",
                }}
              >
                AOIE 2.0
              </span>
            </div>

            {/* Middle container: Title and description */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "40px 0",
              }}
            >
              <h1
                style={{
                  color: "#ffffff",
                  fontSize: artwork.title.length > 25 ? 36 : 48,
                  fontWeight: "bold",
                  lineHeight: 1.2,
                  margin: 0,
                  marginBottom: 16,
                  wordBreak: "break-word",
                }}
              >
                {artwork.title}
              </h1>
              {artwork.description && (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: 16,
                    lineHeight: 1.5,
                    margin: 0,
                    display: "flex",
                    maxHeight: 120,
                    overflow: "hidden",
                  }}
                >
                  {artwork.description.length > 150
                    ? artwork.description.substring(0, 150) + "..."
                    : artwork.description}
                </p>
              )}
            </div>

            {/* Bottom: Artist info */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginTop: "auto",
                borderTop: "1px solid #334155",
                paddingTop: 30,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={artistName}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    marginRight: 16,
                    border: "2px solid #334155",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 22,
                    fontWeight: "bold",
                    marginRight: 16,
                    border: "2px solid #334155",
                  }}
                >
                  {initials}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  {artistName}
                </span>
                {artist?.username && (
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    @{artist.username}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation failed:", error);
    return renderFallback("Internal Server Error");
  }
}

function renderFallback(message: string) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: 1200,
          height: 630,
          backgroundColor: "#0f172a",
          color: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: 64, fontWeight: "bold", marginBottom: 20 }}>AOIE 2.0</h1>
        <p style={{ fontSize: 28, color: "#94a3b8" }}>{message}</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
