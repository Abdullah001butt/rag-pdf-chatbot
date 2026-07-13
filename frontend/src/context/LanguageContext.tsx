import * as React from "react"
import { translations, LANGUAGES, type Lang } from "@/i18n/translations"

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
  isRtl: boolean
}

const LanguageContext = React.createContext<LanguageContextValue | undefined>(undefined)

const STORAGE_KEY = "documind_lang"

function isValidLang(value: string | null): value is Lang {
  return !!value && LANGUAGES.some((l) => l.code === value)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isValidLang(stored) ? stored : "en"
  })

  const isRtl = LANGUAGES.find((l) => l.code === lang)?.rtl ?? false

  React.useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = isRtl ? "rtl" : "ltr"
  }, [lang, isRtl])

  function setLang(next: Lang) {
    localStorage.setItem(STORAGE_KEY, next)
    setLangState(next)
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations.en[key] ?? key
  }

  return <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
