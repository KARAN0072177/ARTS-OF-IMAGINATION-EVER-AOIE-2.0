"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Heart,
  Search,
  Sparkles,
} from "lucide-react";

export interface FooterArtwork {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  placeholderUrl?: string;
}

interface FooterExperienceProps {
  artwork: FooterArtwork | null;
}

const smoothEase = [
  0.22, 1, 0.36, 1,
] as const;

const footerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const footerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.68,
      ease: smoothEase,
    },
  },
};

function formatCount(count: number) {
  return new Intl.NumberFormat("en", {
    notation:
      count >= 1000
        ? "compact"
        : "standard",
  }).format(count);
}

export default function FooterExperience({
  artwork,
}: FooterExperienceProps) {
  return (
    <footer className="relative w-full overflow-hidden bg-slate-950 text-white">
      {artwork ? (
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          sizes="100vw"
          className="object-cover opacity-70"
          placeholder={artwork.placeholderUrl ? "blur" : "empty"}
          blurDataURL={artwork.placeholderUrl}
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617,#0f172a_55%,#083344)]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.95)_0%,rgba(2,6,23,0.82)_34%,rgba(2,6,23,0.38)_68%,rgba(2,6,23,0.86)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.26)_0%,rgba(2,6,23,0.1)_42%,rgba(2,6,23,0.94)_100%)]" />

      <motion.div
        variants={footerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true,
          margin: "-80px",
        }}
        className="relative mx-auto flex min-h-[560px] w-full max-w-7xl flex-col justify-between px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <motion.div
          variants={footerItem}
          className="flex items-center justify-between gap-4"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-md ring-1 ring-white/12">
            <Sparkles size={14} />
            One more frame
          </p>

          <p className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-white/45 sm:block">
            AOIE 2.0
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <motion.div variants={footerItem}>
            <h2 className="max-w-5xl text-5xl font-medium leading-[0.92] tracking-[-0.05em] text-white sm:text-7xl lg:text-8xl">
              Leave with one image still in your head.
            </h2>

            <p className="mt-7 max-w-2xl text-base font-light leading-7 text-white/72 sm:text-lg">
              The feed is still moving. Follow what catches your eye, save what
              stays with you, and let AOIE shape the next path.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                Enter the feed
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/search"
                className="group inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/14"
              >
                Search visual worlds
                <Search
                  size={17}
                  className="text-cyan-100 transition group-hover:text-white"
                />
              </Link>
            </div>
          </motion.div>

          {artwork && (
            <motion.div
              variants={footerItem}
              whileHover={{
                y: -6,
              }}
              transition={{
                duration: 0.28,
                ease: "easeOut",
              }}
              className="lg:justify-self-end"
            >
              <Link
                href={`/artwork/${artwork.id}`}
                className="group block rounded-[1.75rem] bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/14 transition hover:bg-white/14"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-900">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    sizes="360px"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
                      From the gallery
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-semibold leading-tight text-white">
                      {artwork.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/62">
                      <span>
                        {artwork.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Heart
                          size={14}
                          className="text-rose-300"
                        />
                        {formatCount(
                          artwork.likesCount
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition group-hover:bg-cyan-50">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
          )}
        </div>

        <motion.div
          variants={footerItem}
          className="mt-12 flex flex-col gap-3 border-t border-white/14 pt-5 text-xs font-semibold text-white/42 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>AOIE 2.0. Arts of Imagination Ever.</p>
          <p>Artwork-first discovery / Built for returning eyes</p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
