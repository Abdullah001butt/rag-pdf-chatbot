import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"

const TYPED_KEYS = ["security.typed.private", "security.typed.yours", "security.typed.secure", "security.typed.offDisk"]

const POINTS = [
  { icon: "key", titleKey: "security.p1.title", bodyKey: "security.p1.body" },
  { icon: "memory", titleKey: "security.p2.title", bodyKey: "security.p2.body" },
  { icon: "lock", titleKey: "security.p3.title", bodyKey: "security.p3.body" },
  { icon: "credit_card", titleKey: "security.p4.title", bodyKey: "security.p4.body" },
  { icon: "verified_user", titleKey: "security.p5.title", bodyKey: "security.p5.body" },
  { icon: "mail", titleKey: "security.p6.title", bodyKey: "security.p6.body" },
]

export function Security() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section className="px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("security.eyebrow")}</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {t("security.headlinePrefix")}{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">{t("security.subtitle")}</p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((p, i) => (
          <motion.div
            key={p.titleKey}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Icon name={p.icon} size={20} />
            </div>
            <h3 className="mb-2 text-base font-bold text-white">{t(p.titleKey)}</h3>
            <p className="text-sm leading-relaxed text-white/50">{t(p.bodyKey)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
