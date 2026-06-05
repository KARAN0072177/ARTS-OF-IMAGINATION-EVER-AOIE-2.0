"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  type Variants,
} from "framer-motion";
import {
  Typewriter,
} from "react-simple-typewriter";
import {
  ArrowRight,
  Bookmark,
  Compass,
  Eye,
  Heart,
  Image as ImageIcon,
  Layers3,
  MessageCircle,
  Palette,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";

export interface HomeArtwork {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  tags: string[];
  likesCount: number;
  views: number;
  artistUsername: string;
  artistName: string;
  artistAvatar: string;
}

export interface HomeArtist {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  bio: string;
  location: string;
}

export interface HomeCollection {
  name: string;
  category: string;
  images: {
    id: string;
    title: string;
    imageUrl: string;
  }[];
  count: number;
}

interface HomeExperienceProps {
  featuredArtworks: HomeArtwork[];
  trendingArtworks: HomeArtwork[];
  artists: HomeArtist[];
  collections: HomeCollection[];
  artworkCount: number;
  artistCount: number;
  isLoggedIn: boolean;
}

const smoothEase = [
  0.22, 1, 0.36, 1,
] as const;

const revealContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const revealItem: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: smoothEase,
    },
  },
};

const signalItems = [
  {
    icon: Heart,
    label: "Likes shape taste",
  },
  {
    icon: Bookmark,
    label: "Saves become boards",
  },
  {
    icon: MessageCircle,
    label: "Comments stay close",
  },
];

function formatCount(count: number) {
  return new Intl.NumberFormat("en", {
    notation:
      count >= 1000
        ? "compact"
        : "standard",
  }).format(count);
}

function getInitial(name: string) {
  return name
    .trim()
    .charAt(0)
    .toUpperCase();
}

function ArtworkImage({
  artwork,
  className,
  sizes,
  priority = false,
}: {
  artwork: Pick<
    HomeArtwork,
    "imageUrl" | "title"
  >;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={artwork.imageUrl}
      alt={artwork.title}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}

function ArtistAvatar({
  artist,
  size = "h-11 w-11",
}: {
  artist: Pick<
    HomeArtist,
    "displayName" | "avatar"
  >;
  size?: string;
}) {
  if (artist.avatar) {
    return (
      <div
        className={`${size} relative shrink-0 overflow-hidden rounded-full bg-slate-950 ring-2 ring-white`}
      >
        <Image
          src={artist.avatar}
          alt={artist.displayName}
          fill
          sizes="72px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white ring-2 ring-white`}
    >
      {getInitial(artist.displayName)}
    </div>
  );
}

function ArtworkArtistAvatar({
  artwork,
}: {
  artwork: HomeArtwork;
}) {
  if (artwork.artistAvatar) {
    return (
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-950 ring-2 ring-white">
        <Image
          src={artwork.artistAvatar}
          alt={artwork.artistName}
          fill
          sizes="44px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white ring-2 ring-white">
      {getInitial(artwork.artistName)}
    </span>
  );
}

function EmptyArtworkState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center border border-dashed border-slate-300 bg-white p-8 text-center">
      <div>
        <ImageIcon className="mx-auto h-10 w-10 text-cyan-700" />
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
          AOIE is waiting for its first image.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          Upload the first artwork and this page becomes a living discovery
          surface instead of an empty room.
        </p>
        <Link
          href="/upload"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Upload artwork
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}

export default function HomeExperience({
  featuredArtworks,
  trendingArtworks,
  artists,
  collections,
  artworkCount,
  artistCount,
  isLoggedIn,
}: HomeExperienceProps) {
  const hero =
    featuredArtworks[0];
  const trendingSource =
    trendingArtworks.length > 0
      ? trendingArtworks
      : featuredArtworks;
  const trendingItems =
    trendingSource.slice(0, 10);
  const marqueeTrendingItems =
    trendingItems.length > 0
      ? [
          ...trendingItems,
          ...trendingItems,
        ]
      : [];
  const artistItems = artists.slice(0, 8);
  const featuredArtist =
    artistItems[0];
  const supportingArtists =
    artistItems.slice(1, 5);
  const closingArtworks =
    featuredArtworks.slice(0, 3);

  if (!hero) {
    return <EmptyArtworkState />;
  }

  return (
    <motion.div
      variants={revealContainer}
      initial="hidden"
      animate="show"
      className="pb-8"
    >
      <motion.section
        variants={revealItem}
        className="relative left-1/2 -mt-10 w-screen -translate-x-1/2 overflow-hidden bg-slate-950"
      >
        <div className="relative h-[min(760px,calc(100vh-5rem))] min-h-[560px]">
          <ArtworkImage
            artwork={hero}
            sizes="100vw"
            priority
            className="object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.76)_34%,rgba(2,6,23,0.22)_68%,rgba(2,6,23,0.62)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.3)_0%,rgba(2,6,23,0)_38%,rgba(2,6,23,0.88)_100%)]" />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-7 text-white sm:px-6 sm:py-9 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-md">
                <Sparkles size={14} />
                Arts of Imagination Ever
              </div>

              <div className="hidden items-center gap-6 text-sm text-white/70 sm:flex">
                <span className="inline-flex items-center gap-2">
                  <ImageIcon
                    size={16}
                    className="text-cyan-200"
                  />
                  {formatCount(
                    artworkCount
                  )}{" "}
                  artworks
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserRound
                    size={16}
                    className="text-cyan-200"
                  />
                  {formatCount(
                    artistCount
                  )}{" "}
                  artists
                </span>
              </div>
            </div>

            <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end">
              <div>
                <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-950">
                  <Compass size={14} />
                  Begin with discovery
                </p>
                <h1 className="max-w-5xl text-5xl font-semibold leading-[0.93] tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl">
                  Discover art that feels{" "}
                  <span className="block font-light text-cyan-100">
                    <Typewriter
                      words={[
                        "cinematic.",
                        "personal.",
                        "collectable.",
                        "alive.",
                      ]}
                      loop={0}
                      cursor
                      cursorStyle="|"
                      typeSpeed={70}
                      deleteSpeed={45}
                      delaySpeed={1500}
                    />
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-base font-light leading-7 text-white/76 sm:text-lg">
                  AOIE is a living gallery for following artists, collecting
                  references, and letting your taste shape what appears next.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/feed"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50"
                  >
                    Enter the feed
                    <ArrowRight size={17} />
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/14"
                  >
                    Search the gallery
                    <Search size={17} />
                  </Link>
                </div>
              </div>

              <motion.div
                whileHover={{
                  y: -6,
                }}
                transition={{
                  duration: 0.28,
                  ease: "easeOut",
                }}
              >
                <Link
                  href={`/artwork/${hero.id}`}
                  className="group block rounded-[1.75rem] bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur-md ring-1 ring-white/15 transition hover:bg-white/14"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                        Featured image
                      </p>
                      <h2 className="mt-2 line-clamp-2 text-2xl font-semibold leading-tight">
                        {hero.title}
                      </h2>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition group-hover:bg-cyan-50">
                      <ArrowRight size={18} />
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <ArtworkArtistAvatar
                      artwork={hero}
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {hero.artistName}
                      </p>
                      <p className="text-xs text-white/62">
                        @{hero.artistUsername ||
                          "artist"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-4 border-t border-white/14 pt-4 text-sm text-white/72">
                    <span className="inline-flex items-center gap-1.5">
                      <Heart
                        size={15}
                        className="text-rose-300"
                      />
                      {formatCount(
                        hero.likesCount
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye
                        size={15}
                        className="text-cyan-200"
                      />
                      {formatCount(
                        hero.views
                      )}
                    </span>
                    <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-semibold text-white">
                      {hero.category}
                    </span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={revealItem}
        className="relative left-1/2 w-screen -translate-x-1/2 py-14 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                <TrendingUp size={15} />
                Trending this week
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                What people keep returning to
              </h2>
            </div>
            <Link
              href="/feed"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Open feed
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="relative mt-7 overflow-hidden pb-3">
          <style>
            {`
              @keyframes aoie-home-trending-marquee {
                from { transform: translate3d(0, 0, 0); }
                to { transform: translate3d(-50%, 0, 0); }
              }

              .aoie-home-trending-track {
                animation: aoie-home-trending-marquee 42s linear infinite;
              }

              .aoie-home-trending-shell:hover .aoie-home-trending-track {
                animation-play-state: paused;
              }
            `}
          </style>
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-20 bg-gradient-to-r from-[#f7f8fb] to-transparent" />
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-20 bg-gradient-to-l from-[#f7f8fb] to-transparent" />

          <div className="aoie-home-trending-shell overflow-hidden">
            <div className="aoie-home-trending-track flex w-max gap-5 px-4 pb-2 will-change-transform sm:px-6 lg:px-8">
              {marqueeTrendingItems.map((artwork, index) => (
                <motion.div
                  key={`${artwork.id}-${index}`}
                  whileHover={{
                    y: -6,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut",
                  }}
                >
                  <Link
                    href={`/artwork/${artwork.id}`}
                    className="group block w-[180px]"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[1.4rem] bg-slate-200 shadow-sm">
                      <ArtworkImage
                        artwork={artwork}
                        sizes="180px"
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-950 shadow-sm backdrop-blur">
                        {String(
                          (index %
                            trendingItems.length) +
                            1
                        ).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                        {artwork.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <Heart
                          size={13}
                          className="text-rose-500"
                        />
                        {formatCount(
                          artwork.likesCount
                        )}
                        <span>
                          {artwork.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {featuredArtist && (
        <motion.section
          variants={revealItem}
          className="grid gap-12 py-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start"
        >
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Artist roster
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">
              Meet the studios shaping the feed.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              AOIE should feel like a place with people inside it. Follow
              artists, read their profile, and let their work keep returning to
              your discovery path.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Browse artists
                <UserRound size={16} />
              </Link>
              <Link
                href={`/artist/${featuredArtist.username}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Featured studio
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-9 grid gap-3">
              {[
                {
                  icon: UserRound,
                  label: "Public studios",
                  text: "Profiles collect the artist's identity, gallery, and story.",
                },
                {
                  icon: Compass,
                  label: "Better discovery",
                  text: "Following artists keeps familiar creative worlds close.",
                },
                {
                  icon: MessageCircle,
                  label: "Real feedback",
                  text: "Comments, likes, and saves connect viewers back to creators.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 border-t border-slate-200 pt-4"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                      <Icon size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5">
            <Link
              href={`/artist/${featuredArtist.username}`}
              className="group overflow-hidden rounded-[2rem] bg-slate-950 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="relative aspect-[21/9] overflow-hidden bg-slate-900">
                {featuredArtist.banner ? (
                  <Image
                    src={featuredArtist.banner}
                    alt={`${featuredArtist.displayName} banner`}
                    fill
                    sizes="(min-width: 1024px) 780px, 100vw"
                    className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(135deg,#020617,#0f172a)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/10 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full bg-white/14 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100 backdrop-blur">
                  Featured artist
                </div>
              </div>

              <div className="grid gap-5 p-5 text-white sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                <ArtistAvatar
                  artist={featuredArtist}
                  size="h-20 w-20"
                />
                <div>
                  <h3 className="text-3xl font-semibold tracking-tight">
                    {featuredArtist.displayName}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-white/60">
                    @{featuredArtist.username}
                  </p>
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/72">
                    {featuredArtist.bio ||
                      "Building a visual world on AOIE."}
                  </p>
                </div>
                <span className="hidden h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950 transition group-hover:bg-cyan-50 sm:flex">
                  <ArrowRight size={19} />
                </span>
              </div>
            </Link>

            <div className="grid gap-3">
              {supportingArtists.map((artist) => (
                <motion.div
                  key={artist.id}
                  whileHover={{
                    x: 5,
                  }}
                  transition={{
                    duration: 0.22,
                    ease: "easeOut",
                  }}
                >
                  <Link
                    href={`/artist/${artist.username}`}
                    className="group grid gap-4 rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white hover:shadow-md sm:grid-cols-[11rem_1fr_auto] sm:items-center"
                  >
                    <div className="relative h-28 overflow-hidden rounded-[1.1rem] bg-slate-100 sm:h-24">
                      {artist.banner ? (
                        <Image
                          src={artist.banner}
                          alt={`${artist.displayName} banner`}
                          fill
                          sizes="176px"
                          className="object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="h-full w-full bg-[linear-gradient(135deg,#f8fafc,#dbeafe)]" />
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <ArtistAvatar
                        artist={artist}
                        size="h-12 w-12"
                      />
                      <div>
                        <p className="line-clamp-1 text-lg font-semibold text-slate-950">
                          {artist.displayName}
                        </p>
                        <p className="text-sm text-slate-500">
                          @{artist.username}
                        </p>
                        <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                          {artist.bio ||
                            "Building a visual world on AOIE."}
                        </p>
                      </div>
                    </div>

                    <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition group-hover:bg-slate-950 group-hover:text-white sm:flex">
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      <motion.section
        variants={revealItem}
        className="relative left-1/2 w-screen -translate-x-1/2 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                <Layers3 size={15} />
                Collected worlds
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
                Boards turn browsing into memory.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
              Save artwork into focused collections so inspiration does not
              disappear after the scroll.
            </p>
          </div>

          <div className="mt-9 grid gap-6 lg:grid-cols-3">
            {collections.map(
              (collection) => (
                <Link
                  href="/saved"
                  key={collection.name}
                  className="group block"
                >
                  <div className="grid h-72 grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-[1.75rem] bg-slate-100 shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-xl">
                    {collection.images.map(
                      (image, index) => (
                        <div
                          key={image.id}
                          className={
                            index === 0
                              ? "relative row-span-2 overflow-hidden"
                              : "relative overflow-hidden"
                          }
                        >
                          <Image
                            src={
                              image.imageUrl
                            }
                            alt={image.title}
                            fill
                            sizes="(min-width: 1024px) 210px, 50vw"
                            className="object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">
                        {collection.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatCount(
                          collection.count
                        )}{" "}
                        images saved by theme
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-600 group-hover:text-white">
                      <Layers3 size={20} />
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={revealItem}
        className="grid gap-10 py-14 lg:grid-cols-[1fr_0.95fr] lg:items-center"
      >
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            <Palette size={15} />
            Stay for the loop
          </p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">
            Look. React. Collect. Return to something sharper.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            AOIE learns through the small creative signals people actually
            leave behind: a like, a save, a comment, a follow, a download, a
            shared image.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {signalItems.map((item) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  whileHover={{
                    y: -4,
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
                >
                  <Icon
                    size={16}
                    className="text-cyan-700"
                  />
                  {item.label}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {closingArtworks.map(
            (artwork, index) => (
              <Link
                href={`/artwork/${artwork.id}`}
                key={artwork.id}
                className={
                  index === 0
                    ? "group relative col-span-2 aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-slate-200 shadow-lg shadow-slate-950/10"
                    : "group relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-slate-200 shadow-sm"
                }
              >
                <ArtworkImage
                  artwork={artwork}
                  sizes={
                    index === 0
                      ? "(min-width: 1024px) 420px, 70vw"
                      : "(min-width: 1024px) 190px, 30vw"
                  }
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/68 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {artwork.title}
                  </p>
                </div>
              </Link>
            )
          )}
        </div>
      </motion.section>

      <motion.section
        variants={revealItem}
        className="border-t border-slate-200 py-12"
      >
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Begin anywhere
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              One image is enough to start the path.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start exploring
              <ArrowRight size={17} />
            </Link>
            <Link
              href={
                isLoggedIn
                  ? "/profile/become-artist"
                  : "/register"
              }
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {isLoggedIn
                ? "Apply as artist"
                : "Create account"}
            </Link>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
