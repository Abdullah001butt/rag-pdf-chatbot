import { motion } from "framer-motion"

const BADGES = [
  { icon: "⚡", label: "Powered by Gemini 2.5" },
  { icon: "💳", label: "Secured by Stripe" },
  { icon: "🔍", label: "OCR for scanned PDFs" },
  { icon: "🔒", label: "HTTPS everywhere" },
  { icon: "🐘", label: "PostgreSQL-backed" },
  { icon: "📧", label: "Verified email delivery" },
]

export function TrustBar() {
  return (
    <section className="border-y border-white/10 bg-white/[0.015] px-6 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-4"
      >
        {BADGES.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-emerald-400"
          >
            <span className="text-base">{b.icon}</span>
            {b.label}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
