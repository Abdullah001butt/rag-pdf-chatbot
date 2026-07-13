import { motion } from "framer-motion"
import * as React from "react"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"

const TYPED_KEYS = ["faq.typed.answered", "faq.typed.explained", "faq.typed.clarified"]

const FAQ_KEYS = [
  { qKey: "faq.q1.q", aKey: "faq.q1.a" },
  { qKey: "faq.q2.q", aKey: "faq.q2.a" },
  { qKey: "faq.q3.q", aKey: "faq.q3.a" },
  { qKey: "faq.q4.q", aKey: "faq.q4.a" },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="border-b border-white/10 py-5 text-left">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4">
        <span className="font-semibold text-white">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }} className="text-emerald-400">
          +
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="mt-3 text-sm leading-relaxed text-white/50">{a}</p>
      </motion.div>
    </div>
  )
}

export function Faq() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section id="faq" className="px-6 py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("faq.eyebrow")}</p>
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {t("faq.headlinePrefix")}{" "}
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
          </span>
        </h2>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-14 max-w-2xl"
      >
        {FAQ_KEYS.map((item) => (
          <FaqItem key={item.qKey} q={t(item.qKey)} a={t(item.aKey)} />
        ))}
      </motion.div>
    </section>
  )
}
