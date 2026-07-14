import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "@/context/LanguageContext"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Icon } from "@/components/ui/icon"

const LINKS = [
  { id: "how-it-works", labelKey: "nav.howItWorks" },
  { id: "editor", labelKey: "nav.editor" },
  { id: "pricing", labelKey: "nav.pricing" },
  { id: "faq", labelKey: "nav.faq" },
]

export function LandingNav() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = React.useState(false)

  function scrollTo(id: string) {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/logo.png" alt="Documind AI" className="h-8 w-8 shrink-0 rounded-lg object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="truncate text-base font-extrabold text-white sm:text-lg">
            Documind <span className="text-emerald-400">AI</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
          {LINKS.map((link) => (
            <button key={link.id} onClick={() => scrollTo(link.id)} className="relative transition-colors hover:text-white group">
              {t(link.labelKey)}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-emerald-400 transition-all group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black sm:px-5 sm:text-sm"
          >
            {t("nav.signIn")}
          </motion.button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white md:hidden"
            aria-label="Toggle menu"
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {t(link.labelKey)}
                </button>
              ))}
              <div className="mt-2 border-t border-white/10 pt-3">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
