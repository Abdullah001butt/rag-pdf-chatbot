import * as React from "react"
import { LANGUAGES } from "@/i18n/translations"
import { useLanguage } from "@/context/LanguageContext"

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
      >
        🌐 {current.native}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-black/95 py-1 shadow-xl backdrop-blur-md">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${
                l.code === lang ? "text-emerald-400" : "text-white/70 hover:text-white"
              }`}
            >
              <span>{l.native}</span>
              {l.code === lang && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
