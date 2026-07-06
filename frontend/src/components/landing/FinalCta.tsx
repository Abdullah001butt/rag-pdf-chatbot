import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export function FinalCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden px-6 py-28 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(16,185,129,0.18), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.08] to-transparent px-8 py-16"
      >
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Ready to understand your <span className="text-emerald-400">first document?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/50">
          No credit card required. Upload a PDF and get grounded answers in minutes.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 rounded-full bg-emerald-400 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105"
          >
            Get Started Free
            <span aria-hidden>→</span>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="rounded-full border border-white/15 px-8 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            Try sample document
          </button>
        </div>
      </motion.div>
    </section>
  )
}
