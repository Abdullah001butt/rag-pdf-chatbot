import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"

const TYPED_KEYS = [
  "usecases.typed.you",
  "usecases.typed.students",
  "usecases.typed.legal",
  "usecases.typed.researchers",
  "usecases.typed.freelancers",
  "usecases.typed.hr",
]

const CASES = [
  { icon: "school", titleKey: "usecases.students.title", bodyKey: "usecases.students.body" },
  { icon: "gavel", titleKey: "usecases.legal.title", bodyKey: "usecases.legal.body" },
  { icon: "home", titleKey: "usecases.realestate.title", bodyKey: "usecases.realestate.body" },
  { icon: "science", titleKey: "usecases.researchers.title", bodyKey: "usecases.researchers.body" },
  { icon: "badge", titleKey: "usecases.hr.title", bodyKey: "usecases.hr.body" },
  { icon: "receipt_long", titleKey: "usecases.freelancers.title", bodyKey: "usecases.freelancers.body" },
]

export function UseCases() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section className="px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("usecases.eyebrow")}</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {t("usecases.headlinePrefix")}{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">{t("usecases.subtitle")}</p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c, i) => (
          <motion.div
            key={c.titleKey}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Icon name={c.icon} size={20} />
            </div>
            <h3 className="mb-2 text-base font-bold text-white">{t(c.titleKey)}</h3>
            <p className="text-sm leading-relaxed text-white/50">{t(c.bodyKey)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
