"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageCircle,
  DollarSign,
  Zap,
  Eye,
  Share2,
  Lock,
  TrendingUp,
} from "lucide-react";
import { mockCreators } from "@/lib/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg">👁️</span>
            <span className="font-bold text-lg tracking-tight text-white">
              veild
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Dashboard
            </Link>
            <Link
              href="/alex_creator"
              className="text-sm font-medium bg-violet-700 hover:bg-violet-600 transition-colors text-white px-4 py-1.5 rounded-full"
            >
              Claim your link
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-700/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium"
          >
            <Zap className="w-3 h-3" />
            Anonymous. Authentic. Yours.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Your fans have things{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
              to say.
            </span>
            <br />
            Anonymously.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-xl mx-auto"
          >
            Veild gives creators a private inbox where fans can speak freely —
            no handles, no followers, no judgment. Reply. Earn. Publish.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link
              href="/alex_creator"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 transition-all text-white font-semibold px-7 py-3.5 rounded-full text-sm shadow-lg shadow-violet-900/40"
            >
              Claim your Veild link
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/alex_creator/wall"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-zinc-300 font-medium px-7 py-3.5 rounded-full text-sm"
            >
              See how it works
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 text-sm text-zinc-500"
          >
            {[
              { label: "creators", value: "2,400+" },
              { label: "messages sent", value: "50k+" },
              { label: "earned", value: "$125k+" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-white font-semibold">{s.value}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CREATOR CARDS */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">
            Featured creators
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">
            See what&apos;s possible
          </h2>
          <p className="text-zinc-500 mt-2 text-sm">
            These creators are already building deeper connections with their
            fans.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCreators.map((creator, i) => (
            <motion.div
              key={creator.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-900/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#1a1a1a] ring-2 ring-white/5 group-hover:ring-violet-500/30 transition-all shrink-0">
                  <Image
                    src={creator.avatar}
                    alt={creator.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {creator.name}
                  </p>
                  <p className="text-zinc-500 text-xs truncate">
                    @{creator.username}
                  </p>
                </div>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed mb-4 line-clamp-2">
                {creator.bio}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  {
                    icon: MessageCircle,
                    value: formatNumber(creator.totalMessages),
                    label: "messages",
                  },
                  {
                    icon: DollarSign,
                    value: `$${creator.earnings.toFixed(0)}`,
                    label: "earned",
                  },
                  {
                    icon: TrendingUp,
                    value: `${creator.replyRate}%`,
                    label: "reply rate",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/3 rounded-xl p-2.5 text-center"
                  >
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={`/${creator.username}`}
                className="block w-full text-center text-xs font-medium text-violet-400 border border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/10 py-2 rounded-lg transition-all"
              >
                Send a message →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Simple as it sounds
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Share2,
              step: "01",
              title: "Share your link",
              desc: "Post your unique Veild link anywhere — bio, story, newsletter.",
            },
            {
              icon: Lock,
              step: "02",
              title: "Fans send messages",
              desc: "Anyone can drop an anonymous message. No account required.",
            },
            {
              icon: DollarSign,
              step: "03",
              title: "Earn on priority",
              desc: "Fans pay $1 to jump the queue. You keep everything.",
            },
            {
              icon: Eye,
              step: "04",
              title: "Reply & publish",
              desc: "Reply privately or publish your answers to your public wall.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="relative bg-[#111] border border-white/5 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-3xl font-black text-white/5">
                  {item.step}
                </span>
              </div>
              <p className="font-semibold text-sm mb-1.5">{item.title}</p>
              <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-4 py-16 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-b from-violet-900/30 to-[#111] border border-violet-500/20 rounded-3xl px-8 py-12 overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-violet-600/20 rounded-full blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to hear from your fans?
            </h2>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
              Claim your free link and start receiving anonymous messages in
              minutes.
            </p>
            <Link
              href="/alex_creator"
              className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 transition-all text-white font-semibold px-8 py-3.5 rounded-full text-sm shadow-lg shadow-violet-900/40 group"
            >
              Claim your Veild link
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-4 py-8 text-center text-zinc-600 text-xs">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span>👁️</span>
          <span className="font-bold text-zinc-400">veild</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-3">
          <Link href="#" className="hover:text-zinc-400 transition-colors">
            Privacy
          </Link>
          <Link href="#" className="hover:text-zinc-400 transition-colors">
            Terms
          </Link>
          <Link href="/dashboard" className="hover:text-zinc-400 transition-colors">
            Dashboard
          </Link>
        </div>
        <p>© 2024 Veild. All rights reserved.</p>
      </footer>
    </div>
  );
}
