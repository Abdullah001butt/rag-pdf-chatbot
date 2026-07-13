import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Typewriter } from "@/components/landing/Typewriter"

const TYPED_WORDS = ["summarized?", "signed?", "quizzed?", "redacted?", "filled out?", "compared?"]

export function FinalCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden px-6 py-28 text-center">
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(16,185,129,0.18), transparent 70%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.08] to-transparent px-8 py-16"
      >
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
        >
          Ready to get your PDF{" "}
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            <Typewriter words={TYPED_WORDS} cursorClassName="bg-emerald-400" />
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-4 max-w-md text-white/50"
        >
          No credit card required. Upload a PDF and get grounded answers in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="group flex items-center gap-2 rounded-full bg-emerald-400 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20"
          >
            Get Started Free
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="rounded-full border border-white/15 px-8 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            Try sample document
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}
