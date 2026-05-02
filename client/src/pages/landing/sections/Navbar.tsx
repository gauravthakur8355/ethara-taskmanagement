import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60 shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
            E
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-semibold text-zinc-100 tracking-tight">
              Ethara
            </span>
            <span className="hidden sm:inline text-xs text-zinc-500 font-medium">
              Task Management
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <a href="#features" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            How it Works
          </a>

          <div className="w-px h-5 bg-zinc-800" />

          <Link
            to="/login"
            className="text-sm text-zinc-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="text-sm px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:hidden bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 px-6 pb-5 space-y-3"
        >
          <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 hover:text-zinc-200 py-2">
            Features
          </a>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 hover:text-zinc-200 py-2">
            How it Works
          </a>
          <div className="border-t border-zinc-800 pt-3 flex gap-3">
            <Link to="/login" className="flex-1 text-center text-sm py-2.5 rounded-lg border border-zinc-700 text-zinc-300 font-medium">
              Sign In
            </Link>
            <Link to="/signup" className="flex-1 text-center text-sm py-2.5 rounded-lg bg-violet-600 text-white font-medium">
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
