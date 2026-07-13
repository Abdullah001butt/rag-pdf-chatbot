import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "@/context/LanguageContext"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export function LandingNav() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Documind AI" className="h-8 w-8 rounded-lg object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="text-lg font-extrabold text-white">
            Documind <span className="text-emerald-400">AI</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
          <button onClick={() => scrollTo("how-it-works")} className="relative transition-colors hover:text-white group">
            {t("nav.howItWorks")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-emerald-400 transition-all group-hover:w-full" />
          </button>
          <button onClick={() => scrollTo("editor")} className="relative transition-colors hover:text-white group">
            {t("nav.editor")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-emerald-400 transition-all group-hover:w-full" />
          </button>
          <button onClick={() => scrollTo("pricing")} className="relative transition-colors hover:text-white group">
            {t("nav.pricing")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-emerald-400 transition-all group-hover:w-full" />
          </button>
          <button onClick={() => scrollTo("faq")} className="relative transition-colors hover:text-white group">
            {t("nav.faq")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-emerald-400 transition-all group-hover:w-full" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            {t("nav.signIn")}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}
