"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-5xl mb-4">👁️</div>
        <h1 className="text-2xl font-bold mb-2">Nothing here</h1>
        <p className="text-zinc-500 text-sm mb-8 max-w-xs leading-relaxed">
          This page doesn&apos;t exist, or the creator you&apos;re looking for
          hasn&apos;t joined Veild yet.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-full"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-zinc-400 text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
