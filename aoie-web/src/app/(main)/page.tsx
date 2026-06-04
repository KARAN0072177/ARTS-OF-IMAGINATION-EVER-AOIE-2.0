import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import User from "@/models/User";

interface HomeArtwork {
  _id: {
    toString(): string;
  };
  title: string;
  imageUrl: string;
  category: string;
  likesCount?: number;
  artist?: {
    username?: string;
    artistProfile?: {
      displayName?: string;
    };
  };
}

const platformPillars = [
  {
    title: "Visual discovery",
    text: "Browse artwork through masonry feeds, search, trending rows, and recommendation-driven image views.",
    icon: Search,
  },
  {
    title: "Creator identity",
    text: "Artists get profile banners, avatars, galleries, public pages, and an approval workflow before uploading.",
    icon: Palette,
  },
  {
    title: "Collections",
    text: "Save artwork into focused boards like wallpapers, anime inspiration, landscapes, and design references.",
    icon: Bookmark,
  },
];

const workflow = [
  {
    label: "Explore",
    title: "Find images that match your taste",
    text: "Likes, saves, clicks, comments, shares, and downloads help AOIE learn what kind of work you enjoy.",
  },
  {
    label: "Collect",
    title: "Build boards instead of one messy saved list",
    text: "Organize artwork into personal collections and keep your visual references easy to revisit.",
  },
  {
    label: "Create",
    title: "Apply as an artist when you are ready",
    text: "Artist accounts are reviewed by admins, so uploads stay intentional and the gallery keeps quality control.",
  },
];

function formatCount(count: number) {
  return new Intl.NumberFormat("en", {
    notation: count >= 1000 ? "compact" : "standard",
  }).format(count);
}

function getArtistName(artwork: HomeArtwork) {
  return (
    artwork.artist?.artistProfile?.displayName ||
    artwork.artist?.username ||
    "AOIE artist"
  );
}

export default async function HomePage() {
  const session =
    await getServerSession(authOptions);

  await connectDB();

  const [featuredArtworks, artworkCount, artistCount] =
    await Promise.all([
      Artwork.find({
        isPublished: true,
      })
        .select(
          "title imageUrl category likesCount artist"
        )
        .populate(
          "artist",
          "username artistProfile"
        )
        .sort({
          likesCount: -1,
          createdAt: -1,
        })
        .limit(6)
        .lean(),
      Artwork.countDocuments({
        isPublished: true,
      }),
      User.countDocuments({
        role: "artist",
      }),
    ]);

  const artworks =
    featuredArtworks as unknown as HomeArtwork[];
  const heroArtwork = artworks[0];
  const isLoggedIn = !!session?.user?.id;

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 ring-1 ring-cyan-100">
              <Sparkles size={14} />
              Arts of Imagination Ever
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              AOIE 2.0
            </h1>

            <p className="mt-5 max-w-2xl text-xl font-semibold leading-8 text-slate-800">
              A curated visual platform for discovering artwork, saving
              inspiration, following artists, and building a smarter image
              feed from what you actually enjoy.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              AOIE combines a gallery feed, artwork collections, artist
              profiles, comments, notifications, reports, and admin-reviewed
              artist access into one focused creative community.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Explore feed
                <ArrowRight size={17} />
              </Link>
              <Link
                href={
                  isLoggedIn
                    ? "/profile/become-artist"
                    : "/register"
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                {isLoggedIn
                  ? "Become an artist"
                  : "Create account"}
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur">
                <p className="text-2xl font-black text-slate-950">
                  {formatCount(artworkCount)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Artworks
                </p>
              </div>
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur">
                <p className="text-2xl font-black text-slate-950">
                  {formatCount(artistCount)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Artists
                </p>
              </div>
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur">
                <p className="text-2xl font-black text-slate-950">
                  Smart
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Discovery
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 sm:p-5 lg:p-6">
            {artworks.length > 0 ? (
              <div className="grid h-full min-h-[460px] grid-cols-5 grid-rows-6 gap-3">
                {heroArtwork && (
                  <Link
                    href={`/artwork/${heroArtwork._id.toString()}`}
                    className="group relative col-span-5 row-span-3 overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/10 sm:col-span-3 sm:row-span-6"
                  >
                    <img
                      src={heroArtwork.imageUrl}
                      alt={heroArtwork.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200">
                        Featured
                      </p>
                      <h2 className="mt-1 line-clamp-2 text-xl font-black leading-6">
                        {heroArtwork.title}
                      </h2>
                      <p className="mt-1 text-sm text-white/70">
                        by {getArtistName(heroArtwork)}
                      </p>
                    </div>
                  </Link>
                )}

                {artworks.slice(1, 4).map((artwork) => (
                  <Link
                    key={artwork._id.toString()}
                    href={`/artwork/${artwork._id.toString()}`}
                    className="group relative col-span-5 row-span-1 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10 sm:col-span-2 sm:row-span-2"
                  >
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="line-clamp-1 text-sm font-bold">
                        {artwork.title}
                      </p>
                      <p className="mt-0.5 text-xs text-cyan-100">
                        {artwork.category}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white">
                <div>
                  <ImageIcon className="mx-auto h-9 w-9 text-cyan-200" />
                  <p className="mt-4 text-lg font-bold">
                    Your gallery starts here
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-white/70">
                    Upload the first artwork and AOIE will turn this preview
                    into a living gallery.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Featured from AOIE
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Start with the gallery
            </h2>
          </div>
          <Link
            href="/feed"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          >
            View all artwork
            <ArrowRight size={16} />
          </Link>
        </div>

        {artworks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {artworks.slice(0, 4).map((artwork) => (
              <Link
                key={artwork._id.toString()}
                href={`/artwork/${artwork._id.toString()}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-700">
                    {artwork.category}
                  </p>
                  <h3 className="mt-2 line-clamp-1 text-base font-bold text-slate-950">
                    {artwork.title}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    by {getArtistName(artwork)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-6">
            <ImageIcon className="h-7 w-7 shrink-0 text-cyan-700" />
            <div>
              <p className="font-bold text-slate-950">
                Your gallery starts here
              </p>
              <p className="text-sm text-slate-600">
                Upload the first artwork and AOIE will turn this space into a
                live platform preview.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {platformPillars.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Icon size={21} />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            How AOIE feels
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Built for looking, saving, reacting, and returning.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            AOIE is not just an upload wall. It connects browsing behavior
            with recommendations, collections, artist profiles, comments,
            notifications, and moderation so the gallery can grow without
            becoming chaotic.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              "Pinterest-like boards for saved artwork",
              "Instagram-like likes, comments, follows, and notifications",
              "Admin-reviewed artist access and report handling",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"
              >
                <CheckCircle2 className="h-5 w-5 text-cyan-700" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {workflow.map((item, index) => (
            <article
              key={item.label}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                    {item.label}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_0.9fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              Choose your path
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              Start as a viewer. Grow into an artist when your profile is ready.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
              Every new account starts as a user. If you want to upload,
              submit an artist application with sample work and profile
              details. Admins review it before upload access opens.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-50"
              >
                Search artwork
                <Search size={17} />
              </Link>
              <Link
                href="/profile/become-artist"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Artist application
                <UploadCloud size={17} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/10 p-6 sm:grid-cols-2 lg:border-l lg:border-t-0">
            <div className="rounded-3xl bg-white/10 p-5">
              <ShieldCheck className="h-7 w-7 text-cyan-200" />
              <p className="mt-4 text-lg font-bold">
                Safer gallery growth
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Reports, admin review, and artist approvals help keep the
                platform intentional.
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <MessageCircle className="h-7 w-7 text-cyan-200" />
              <p className="mt-4 text-lg font-bold">
                Social feedback loop
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Comments, replies, likes, follows, and notifications keep
                artists connected to viewers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
