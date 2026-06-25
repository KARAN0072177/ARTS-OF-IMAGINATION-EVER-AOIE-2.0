"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  LogIn, 
  Shield, 
  Menu, 
  X, 
  Compass, 
  Search, 
  Upload, 
  Bookmark, 
  UserRound, 
  Sparkles 
} from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

interface NavbarClientProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function NavbarClient({ isLoggedIn, isAdmin }: NavbarClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for sticky layout state
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/feed", label: "Feed", icon: Compass },
    { href: "/search", label: "Search", icon: Search },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/saved", label: "Saved", icon: Bookmark },
  ];

  // Mobile drawer staggered animations
  const menuContainerVariants: Variants = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        staggerChildren: 0.05,
        delayChildren: 0.02,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
        staggerChildren: 0.03,
        staggerDirection: -1,
      },
    },
  };

  const menuItemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 350, damping: 28 } 
    },
    exit: { 
      opacity: 0, 
      y: 6, 
      transition: { duration: 0.15 } 
    },
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${
        scrolled 
          ? "bg-[#f7f8fb]/90 backdrop-blur-md border-b border-slate-200/50 py-3 shadow-sm" 
          : "bg-white/80 backdrop-blur-md border-b border-slate-100/50 py-4.5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo - Minimalist & High-Contrast Typography */}
          <Link href="/" className="group flex flex-col focus:outline-none select-none">
            <span className="text-lg font-extrabold tracking-[0.22em] text-slate-900 uppercase transition-colors duration-300 group-hover:text-slate-600">
              AOIE 2.0
            </span>
            <span className="text-[7.5px] font-bold tracking-[0.32em] text-slate-400 uppercase -mt-0.5 leading-none transition-colors duration-300 group-hover:text-slate-500">
              Arts of Imagination
            </span>
          </Link>

          {/* Desktop Navigation - Minimalist Icons + Editorial Typography */}
          <nav className="hidden md:flex items-center gap-7 relative z-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const LinkIcon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative py-1 text-xs font-bold uppercase tracking-widest transition-colors duration-300 flex items-center gap-1.5 focus:outline-none ${
                    isActive 
                      ? "text-slate-950" 
                      : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <LinkIcon 
                    size={13} 
                    className={`transition-transform duration-300 ${
                      isActive 
                        ? "text-slate-950 scale-105" 
                        : "text-slate-400 group-hover:text-slate-800 group-hover:scale-110"
                    }`} 
                  />
                  <span>{link.label}</span>
                  
                  {/* Single razor-sharp bottom accent line */}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavLine"
                      className="absolute bottom-[-16px] left-0 right-0 h-[1.5px] bg-slate-950 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={`group relative py-1 text-xs font-bold uppercase tracking-widest transition-colors duration-300 inline-flex items-center gap-1 focus:outline-none ${
                  pathname === "/admin" 
                    ? "text-slate-950" 
                    : "text-indigo-600 hover:text-indigo-800"
                }`}
              >
                <Shield 
                  size={12} 
                  className={`relative -top-0.5 transition-transform duration-300 ${
                    pathname === "/admin"
                      ? "scale-105 text-slate-950"
                      : "text-indigo-500 group-hover:scale-110"
                  }`} 
                />
                <span>Admin</span>
                {pathname === "/admin" && (
                  <motion.span
                    layoutId="activeNavLine"
                    className="absolute bottom-[-16px] left-0 right-0 h-[1.5px] bg-slate-950 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-5">
                <NotificationBell />

                <Link
                  href="/profile"
                  className={`group relative py-1 text-xs font-bold uppercase tracking-widest transition-colors duration-300 flex items-center gap-1.5 focus:outline-none ${
                    pathname === "/profile"
                      ? "text-slate-950"
                      : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <UserRound 
                    size={13} 
                    className={`relative -top-0.5 transition-transform duration-300 ${
                      pathname === "/profile"
                        ? "scale-105 text-slate-950"
                        : "text-slate-400 group-hover:text-slate-800 group-hover:scale-110"
                    }`} 
                  />
                  <span>Profile</span>
                  {pathname === "/profile" && (
                    <motion.span
                      layoutId="activeNavLine"
                      className="absolute bottom-[-16px] left-0 right-0 h-[1.5px] bg-slate-950 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>


                <div className="h-3 w-[1px] bg-slate-200" />
                <LogoutButton variant="nav" />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/login"
                  className="rounded-md border border-slate-950 bg-slate-950 px-4.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-transparent hover:text-slate-950"
                >
                  Login
                </Link>
              </div>
            )}

            {/* Mobile controls */}
            <div className="flex items-center gap-3 md:hidden">
              {isLoggedIn && <NotificationBell />}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus:outline-none"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            variants={menuContainerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="md:hidden w-full overflow-hidden bg-white/95 backdrop-blur-md border-t border-slate-200/50 shadow-md"
          >
            <div className="px-4 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Main links */}
              <div className="grid gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const LinkIcon = link.icon;
                  return (
                    <motion.div key={link.href} variants={menuItemVariants}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${
                          isActive
                            ? "bg-slate-50 border border-slate-200/80 text-slate-950"
                            : "text-slate-400 hover:bg-slate-50/50 hover:text-slate-800 border border-transparent"
                        }`}
                      >
                        <span className={`p-1 rounded ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                          <LinkIcon size={14} />
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Admin Panel Link */}
              {isAdmin && (
                <motion.div variants={menuItemVariants} className="pt-2 border-t border-slate-100">
                  <Link
                    href="/admin"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${
                      pathname === "/admin"
                        ? "bg-slate-50 border border-slate-200/80 text-slate-950"
                        : "text-slate-400 hover:bg-slate-50/50 hover:text-slate-800 border border-transparent"
                    }`}
                  >
                    <span className="p-1 rounded bg-slate-100 text-slate-400">
                      <Shield size={14} />
                    </span>
                    <span>Admin Panel</span>
                  </Link>
                </motion.div>
              )}

              {/* User details and profile link */}
              <div className="pt-4 border-t border-slate-200/60 space-y-3">
                {isLoggedIn ? (
                  <>
                    <motion.div variants={menuItemVariants}>
                      <Link
                        href="/profile"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${
                          pathname === "/profile"
                            ? "bg-slate-50 border border-slate-200/80 text-slate-950"
                            : "text-slate-400 hover:bg-slate-50/50 hover:text-slate-800 border border-transparent"
                        }`}
                      >
                        <span className="p-1 rounded bg-slate-100 text-slate-400">
                          <UserRound size={14} />
                        </span>
                        <span>My Profile</span>
                      </Link>
                    </motion.div>

                    <motion.div variants={menuItemVariants} className="pt-1">
                      <LogoutButton variant="full" />
                    </motion.div>
                  </>
                ) : (
                  <motion.div variants={menuItemVariants}>
                    <Link
                      href="/login"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:bg-slate-900 transition-colors"
                    >
                      <LogIn size={14} />
                      <span>Log In</span>
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Tagline footer in drawer */}
              <motion.div 
                variants={menuItemVariants} 
                className="pt-4 text-center"
              >
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  <Sparkles size={10} className="text-slate-400" />
                  Arts of Imagination Ever
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
