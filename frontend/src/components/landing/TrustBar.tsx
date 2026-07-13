import { motion } from "framer-motion"
import { useLanguage } from "@/context/LanguageContext"

const BADGE_KEYS = [
  { icon: "⚡", key: "trustbar.gemini" },
  { icon: "💳", key: "trustbar.stripe" },
  { icon: "🔍", key: "trustbar.ocr" },
  { icon: "🔒", key: "trustbar.https" },
  { icon: "🐘", key: "trustbar.postgres" },
  { icon: "📧", key: "trustbar.email" },
]

export function TrustBar() {
  const { t } = useLanguage()
  return (
    <section className="border-y border-white/10 bg-white/[0.015] px-6 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-4"
      >
        {BADGE_KEYS.map((b, i) => (
          <motion.div
            key={b.key}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-emerald-400"
          >
            <span className="text-base">{b.icon}</span>
            {t(b.key)}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
