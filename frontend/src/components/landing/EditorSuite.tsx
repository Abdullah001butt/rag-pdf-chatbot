import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"

const TYPED_KEYS = ["editor.typed.edit", "editor.typed.sign", "editor.typed.redact", "editor.typed.fill", "editor.typed.ocr"]

const TOOLS = [
  { icon: "✏️", titleKey: "editor.tool1.title", bodyKey: "editor.tool1.body" },
  { icon: "✍️", titleKey: "editor.tool2.title", bodyKey: "editor.tool2.body" },
  { icon: "📝", titleKey: "editor.tool3.title", bodyKey: "editor.tool3.body" },
  { icon: "🔍", titleKey: "editor.tool4.title", bodyKey: "editor.tool4.body" },
  { icon: "✨", titleKey: "editor.tool5.title", bodyKey: "editor.tool5.body" },
  { icon: "🛡️", titleKey: "editor.tool6.title", bodyKey: "editor.tool6.body" },
]

export function EditorSuite() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section id="editor" className="border-y border-white/10 bg-white/[0.015] px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("editor.eyebrow")}</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {t("editor.headlinePrefix")}{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">{t("editor.subtitle")}</p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={tool.titleKey}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-lg">
              {tool.icon}
            </div>
            <h3 className="mb-2 text-base font-bold text-white">{t(tool.titleKey)}</h3>
            <p className="text-sm leading-relaxed text-white/50">{t(tool.bodyKey)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
