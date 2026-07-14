import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"

const TAB_KEYS = [
  "dash.tab.chat",
  "dash.tab.summary",
  "dash.tab.notes",
  "dash.tab.quiz",
  "dash.tab.flashcards",
  "dash.tab.compare",
  "dash.tab.research",
  "dash.tab.editor",
]
const TYPED_KEYS = ["preview.typed.trust", "preview.typed.verify", "preview.typed.cite", "preview.typed.actOn"]

export function ProductPreview() {
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("preview.eyebrow")}</p>
        <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {t("preview.headlinePrefix")}{" "}
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/50">{t("preview.subtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <div
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-60 blur-3xl"
          style={{ background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(16,185,129,0.25), transparent 70%)" }}
        />

        <div className="overflow-hidden rounded-2xl border border-border bg-surface font-sans shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-border bg-white/[0.03] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
            <span className="ml-3 rounded-md bg-white/5 px-3 py-1 text-xs text-text-muted">documindai.online/dashboard</span>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="hidden w-56 shrink-0 flex-col gap-4 border-r border-border bg-black/40 p-4 md:flex">
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">{t("sidebar.account")}</div>
                <div className="rounded-xl border border-border bg-white/[0.03] p-3">
                  <div className="mb-1.5 text-sm font-bold text-text">Butt2009</div>
                  <span className="inline-block rounded-full border border-transparent bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                    {t("pricing.pro.label")} {t("sidebar.plan")}
                  </span>
                </div>
                <div className="mt-2 w-full rounded-lg bg-accent px-3 py-1.5 text-center text-xs font-semibold text-black">
                  {t("sidebar.manageBilling")}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">{t("sidebar.documents")}</div>
                <div className="w-full rounded-lg border border-border py-1.5 text-center text-xs text-text-muted">{t("sidebar.uploadPdfs")}</div>
                <div className="mt-2 flex items-center gap-1 truncate rounded-lg border border-border bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-text-muted">
                  <Icon name="picture_as_pdf" size={13} className="shrink-0 text-danger/80" />
                  <span className="truncate">Final_Year_Project_Proposal.pdf</span>
                </div>
              </div>
            </div>

            {/* Main panel */}
            <div className="flex-1 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
                  <Icon name="description" size={15} />
                </div>
                <p className="text-xs text-text-muted">{t("dash.tagline")}</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5 border-b border-border pb-3 text-xs">
                {TAB_KEYS.map((k, i) => (
                  <span
                    key={k}
                    className={
                      i === 0
                        ? "rounded-md bg-accent/15 px-2.5 py-1 font-semibold text-accent"
                        : "rounded-md px-2.5 py-1 text-text-muted"
                    }
                  >
                    {t(k)}
                  </span>
                ))}
              </div>

              <div className="mb-4 flex gap-2">
                <div className="flex-1 rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-xs text-text-muted">
                  {t("preview.sampleQuestion")}
                </div>
                <div className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black">→</div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 rounded-xl border border-border bg-white/[0.02] px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-black">U</span>
                  <p className="text-xs text-text">{t("preview.sampleQuestion")}</p>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-border bg-white/[0.02] px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-text">AI</span>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs leading-relaxed text-text">{t("preview.sampleAnswer")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-[10px] text-text-muted">
                        Final_Year_Project_Proposal.pdf · p.3
                      </span>
                      <span className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-[10px] text-text-muted">
                        Final_Year_Project_Proposal.pdf · p.7
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
