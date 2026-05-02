import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-12 sm:p-16 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-500/10 blur-[80px] rounded-full" />

          <h2 className="relative text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
            Ready to streamline your workflow?
          </h2>
          <p className="relative text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
            Join teams already using Ethara to ship faster with clear roles and organized task management.
          </p>

          <Link
            to="/signup"
            className="relative group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-base hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start for Free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
