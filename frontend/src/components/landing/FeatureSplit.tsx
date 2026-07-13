import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"

const TYPED_KEYS = ["feature.typed.facts", "feature.typed.source", "feature.typed.point", "feature.typed.answer"]

const ITEMS = [
  { n: "01", titleKey: "feature.item1.title", bodyKey: "feature.item1.body" },
  { n: "02", titleKey: "feature.item2.title", bodyKey: "feature.item2.body" },
  { n: "03", titleKey: "feature.item3.title", bodyKey: "feature.item3.body" },
  { n: "04", titleKey: "feature.item4.title", bodyKey: "feature.item4.body" },
]

export function FeatureSplit() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section className="border-y border-white/10 bg-white/[0.015] px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">{t("feature.eyebrow")}</p>
          <h2 className="text-5xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-6xl">
            {t("feature.headlinePrefix")}
            <br />
            <span className="text-emerald-400">
              <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
            </span>
          </h2>
          <div className="mt-6 h-px w-16 bg-white/20" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-white/40">{t("feature.tagline")}</p>
        </motion.div>

        <div className="flex flex-col gap-8 border-l border-white/10 pl-8">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-4"
            >
              <span className="text-3xl font-extrabold text-white/10">{item.n}</span>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white">{t(item.titleKey)}</h3>
                <p className="text-sm uppercase tracking-wide text-white/40">{t(item.bodyKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
