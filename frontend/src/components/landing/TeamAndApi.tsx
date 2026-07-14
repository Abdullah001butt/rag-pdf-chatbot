import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"

const TYPED_KEYS = ["teamapi.typed.team", "teamapi.typed.scripts", "teamapi.typed.workflow"]

const WORKSPACE_POINTS = ["teamapi.workspace.p1", "teamapi.workspace.p2", "teamapi.workspace.p3"]

const CURL_LINES = [
  { text: "curl https://documindai.online/v1/chat/ask \\", color: "text-white/70" },
  { text: '  -H "X-Api-Key: dk_••••••••••••" \\', color: "text-emerald-400" },
  { text: '  -H "Content-Type: application/json" \\', color: "text-white/70" },
  { text: '  -d \'{"question": "What is the termination clause?"}\'', color: "text-white/70" },
]

export function TeamAndApi() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section className="border-y border-white/10 bg-white/[0.015] px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("teamapi.eyebrow")}</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {t("teamapi.headlinePrefix")}{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">{t("teamapi.subtitle")}</p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Icon name="groups" size={20} />
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">{t("teamapi.workspace.title")}</h3>
          <p className="mb-4 text-sm text-white/50">{t("teamapi.workspace.body")}</p>
          <ul className="flex flex-col gap-2">
            {WORKSPACE_POINTS.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-white/70">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                {t(key)}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Icon name="code" size={20} />
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">{t("teamapi.api.title")}</h3>
          <p className="mb-4 text-sm text-white/50">{t("teamapi.api.body")}</p>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60 font-mono text-xs">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <div className="overflow-x-auto p-3">
              {CURL_LINES.map((line, i) => (
                <div key={i} className={line.color}>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
