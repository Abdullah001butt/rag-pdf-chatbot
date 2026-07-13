import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"

const TYPED_WORDS = ["faster.", "smarter.", "cited.", "effortless."]

const ROWS = [
  { label: "Finding a clause", manual: "Skim the whole document", ai: "Ask directly, get a cited answer" },
  { label: "Citing your source", manual: "Re-check the page yourself", ai: "Every answer links to doc & page" },
  { label: "Editing text", manual: "Re-export from another tool", ai: "Click-to-edit, right on the page" },
  { label: "Signing", manual: "Print, sign, scan, re-upload", ai: "Draw or type a signature instantly" },
  { label: "Redacting PII", manual: "Black it out by hand", ai: "Auto-detect and redact in one click" },
  { label: "Scanned pages", manual: "Retype the whole thing", ai: "OCR makes it editable instantly" },
  { label: "Multiple documents", manual: "Open tabs, compare manually", ai: "Batch process and compare at once" },
]

export function Comparison() {
  return (
    <section className="border-y border-white/10 bg-white/[0.015] px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">The difference</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Same document, done{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={TYPED_WORDS} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">What changes once Documind AI is doing the work.</p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-white/10"
      >
        <div className="grid grid-cols-[1fr_1fr_1fr] bg-white/[0.03] text-xs font-bold uppercase tracking-wide text-white/40 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div className="px-4 py-3 text-left sm:px-6" />
          <div className="px-4 py-3 text-left sm:px-6">On your own</div>
          <div className="border-l border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-left text-emerald-400 sm:px-6">
            With Documind AI
          </div>
        </div>

        {ROWS.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="grid grid-cols-[1fr_1fr_1fr] border-t border-white/10 text-left text-sm sm:grid-cols-[1.2fr_1fr_1fr]"
          >
            <div className="px-4 py-4 font-semibold text-white sm:px-6">{row.label}</div>
            <div className="flex items-start gap-1.5 px-4 py-4 text-white/40 sm:px-6">
              <span className="mt-0.5 text-white/25">✕</span>
              {row.manual}
            </div>
            <div className="flex items-start gap-1.5 border-l border-emerald-500/20 bg-emerald-500/[0.03] px-4 py-4 text-white/80 sm:px-6">
              <span className="mt-0.5 text-emerald-400">✓</span>
              {row.ai}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
