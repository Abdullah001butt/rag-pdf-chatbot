import { motion } from "framer-motion"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"

const BADGE_KEYS = [
  { icon: "bolt", key: "trustbar.gemini" },
  { icon: "credit_card", key: "trustbar.stripe" },
  { icon: "document_scanner", key: "trustbar.ocr" },
  { icon: "lock", key: "trustbar.https" },
  { icon: "storage", key: "trustbar.postgres" },
  { icon: "mail", key: "trustbar.email" },
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
            <Icon name={b.icon} size={17} />
            {t(b.key)}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
