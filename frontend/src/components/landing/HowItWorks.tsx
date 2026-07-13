import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"

const TYPED_KEYS = ["how.typed.clarity", "how.typed.speed", "how.typed.accuracy", "how.typed.confidence"]

const STEPS = [
  { n: "01", titleKey: "how.step1.title", bodyKey: "how.step1.body" },
  { n: "02", titleKey: "how.step2.title", bodyKey: "how.step2.body" },
  { n: "03", titleKey: "how.step3.title", bodyKey: "how.step3.body" },
]

export function HowItWorks() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section id="how-it-works" className="px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("how.eyebrow")}</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {t("how.headlinePrefix")}{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mt-4 text-white/50">{t("how.subtitle")}</p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-400">
              {step.n}
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{t(step.titleKey)}</h3>
            <p className="text-sm leading-relaxed text-white/50">{t(step.bodyKey)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
