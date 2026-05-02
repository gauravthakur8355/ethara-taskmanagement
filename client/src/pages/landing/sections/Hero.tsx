import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-24 pb-16">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-fuchsia-500/5 blur-[140px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-sm font-medium mb-8 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Team Task Management — Simplified
        </motion.div>

        {/* Heading */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
        >
          <span className="text-zinc-100">Ship faster with</span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Ethara
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          A clean, role-based project management tool for small teams.
          Create projects, assign tasks, track progress — all with strict admin/member workflows.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/signup"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-base hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/login"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-zinc-700 text-zinc-300 font-medium text-base hover:bg-zinc-800/50 hover:border-zinc-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Floating visual element */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 relative"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
            {/* Mock board header */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-zinc-500 font-mono">Ethara — Kanban Board</span>
            </div>

            {/* Mock kanban columns */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "To Do", color: "bg-zinc-500", items: 3 },
                { label: "In Progress", color: "bg-blue-500", items: 2 },
                { label: "In Review", color: "bg-amber-500", items: 1 },
                { label: "Done", color: "bg-emerald-500", items: 4 },
              ].map((col) => (
                <div key={col.label} className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-[11px] text-zinc-400 font-medium">{col.label}</span>
                    <span className="text-[10px] text-zinc-600 ml-auto">{col.items}</span>
                  </div>
                  {Array.from({ length: col.items }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + i * 0.08 + Math.random() * 0.2 }}
                      className="h-8 rounded-lg bg-zinc-800/60 border border-zinc-700/40"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Glow underneath */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-violet-500/10 blur-2xl rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}
