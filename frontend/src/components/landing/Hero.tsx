import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden px-6 pb-28 pt-24 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(16,185,129,0.15), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-400"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        AI-Powered Document Analysis
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
      >
        Understand any <span className="block text-emerald-400">document.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-6 max-w-2xl text-lg text-white/50"
      >
        AI analysis for contracts, leases, reports, and policy docs. Pull out obligations, risks,
        deadlines, and get source-backed answers — in minutes.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/10 transition-transform hover:scale-105"
        >
          Get Started Free
          <span aria-hidden>→</span>
        </button>
        <button
          onClick={() => navigate("/login")}
          className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
        >
          Try sample document
        </button>
      </motion.div>
    </section>
  )
}
