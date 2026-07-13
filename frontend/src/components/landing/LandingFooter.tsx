import { useNavigate } from "react-router-dom"
import { useLanguage } from "@/context/LanguageContext"

export function LandingFooter() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <span>© {new Date().getFullYear()} Documind AI. {t("footer.rights")}</span>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/privacy")} className="hover:text-white">
            {t("footer.privacy")}
          </button>
          <button onClick={() => navigate("/terms")} className="hover:text-white">
            {t("footer.terms")}
          </button>
          <button onClick={() => navigate("/login")} className="font-semibold text-white/70 hover:text-white">
            {t("footer.signIn")}
          </button>
        </div>
      </div>
    </footer>
  )
}
