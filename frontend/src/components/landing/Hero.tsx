import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"

const TYPED_KEYS = [
  "hero.typed.summarized",
  "hero.typed.signed",
  "hero.typed.quizzed",
  "hero.typed.redacted",
  "hero.typed.filledOut",
  "hero.typed.compared",
  "hero.typed.chattedWith",
]

const wordVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export function Hero() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section className="relative overflow-hidden px-6 pb-28 pt-24 text-center">
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(16,185,129,0.15), transparent 70%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-400"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        {t("hero.badge")}
      </motion.div>

      <motion.h1
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
        className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
      >
        <motion.span variants={wordVariants} transition={{ duration: 0.5 }} className="mr-4 inline-block">
          {t("hero.headlinePrefix")}
        </motion.span>
        <motion.span variants={wordVariants} transition={{ duration: 0.5 }} className="mr-4 inline-block">
          {t("hero.headlineMid")}
        </motion.span>
        <motion.span
          variants={wordVariants}
          transition={{ duration: 0.5 }}
          className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent"
        >
          <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
        </motion.span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mx-auto mt-6 max-w-2xl text-lg text-white/50"
      >
        {t("hero.subtitle")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/login")}
          className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/10"
        >
          {t("hero.ctaPrimary")}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/login")}
          className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
        >
          {t("hero.ctaSecondary")}
        </motion.button>
      </motion.div>
    </section>
  )
}
