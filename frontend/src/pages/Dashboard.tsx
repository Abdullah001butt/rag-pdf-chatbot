import * as React from "react"
import { useNavigate } from "react-router-dom"
import { api, type BillingStatus } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { Sidebar } from "@/components/Sidebar"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ChatPanel } from "@/components/ChatPanel"
import { GeneratePanel } from "@/components/GeneratePanel"
import { QuizPanel } from "@/components/QuizPanel"
import { FlashcardsPanel } from "@/components/FlashcardsPanel"
import { ComparePanel } from "@/components/ComparePanel"
import { ResearchPanel } from "@/components/ResearchPanel"
import { PdfEditorPanel } from "@/components/PdfEditorPanel"
import { PdfFormFillerPanel } from "@/components/PdfFormFillerPanel"
import { BatchProcessPanel } from "@/components/BatchProcessPanel"
import { AgentPanel } from "@/components/AgentPanel"
import { AutomationsPanel } from "@/components/AutomationsPanel"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { LoadingState } from "@/components/Spinner"
import { Icon } from "@/components/ui/icon"

const TABS = [
  { key: "chat", icon: "chat", labelKey: "dash.tab.chat" },
  { key: "summary", icon: "summarize", labelKey: "dash.tab.summary" },
  { key: "notes", icon: "menu_book", labelKey: "dash.tab.notes" },
  { key: "quiz", icon: "quiz", labelKey: "dash.tab.quiz" },
  { key: "flashcards", icon: "style", labelKey: "dash.tab.flashcards" },
  { key: "compare", icon: "difference", labelKey: "dash.tab.compare" },
  { key: "research", icon: "travel_explore", labelKey: "dash.tab.research" },
  { key: "editor", icon: "edit_document", labelKey: "dash.tab.editor" },
  { key: "formfiller", icon: "assignment", labelKey: "dash.tab.formfiller" },
  { key: "batch", icon: "bolt", labelKey: "dash.tab.batch" },
  { key: "agent", icon: "smart_toy", labelKey: "dash.tab.agent" },
  { key: "automations", icon: "cycle", labelKey: "dash.tab.automations" },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default function Dashboard() {
  const [tab, setTab] = React.useState<TabKey>("chat")
  const [files, setFiles] = React.useState<string[]>([])
  const [billing, setBilling] = React.useState<BillingStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [checkoutNotice, setCheckoutNotice] = React.useState<string | null>(null)
  const { user, refreshTier } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  React.useEffect(() => {
    async function bootstrap() {
      const params = new URLSearchParams(window.location.search)
      const checkout = params.get("checkout")
      const sessionId = params.get("session_id")

      if (checkout === "success" && sessionId) {
        try {
          const { data } = await api.get("/billing/verify", { params: { session_id: sessionId } })
          setBilling(data)
          refreshTier(data.tier)
          setCheckoutNotice(data.tier === "pro" ? t("dash.checkoutSuccess") : t("dash.checkoutProcessing"))
        } catch {
          setCheckoutNotice(t("dash.checkoutUnconfirmed"))
        }
      } else if (checkout === "cancelled") {
        setCheckoutNotice(t("dash.checkoutCancelled"))
      }

      if (checkout) {
        window.history.replaceState({}, "", window.location.pathname)
      }

      await Promise.allSettled([
        api.get("/documents").then(({ data }) => setFiles(data.files)),
        billing === null ? api.get("/billing/status").then(({ data }) => setBilling(data)) : Promise.resolve(),
      ])
      setLoading(false)
    }
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLocked = (feature: string) => billing?.locked_features.includes(feature) ?? false

  const activeTab = TABS.find((tabItem) => tabItem.key === tab)

  return (
    <div className="flex h-screen flex-col bg-black md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface-2/60 p-4 md:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Documind AI" className="h-7 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="font-semibold text-text">Documind AI</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <Icon name={sidebarOpen ? "close" : "menu"} size={18} />
            {sidebarOpen ? t("dash.close") : t("dash.menu")}
          </button>
        </div>
      </div>

      <div className={`${sidebarOpen ? "block" : "hidden"} md:block`}>
        <Sidebar files={files} onFilesChanged={setFiles} billing={billing} onBillingChanged={setBilling} />
      </div>

      <main className="flex flex-1 flex-col overflow-hidden">
        {user && !user.email_verified && (
          <div className="flex items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-5 py-2 text-sm text-text">
            <span className="flex items-center gap-2">
              <Icon name="mail" size={16} className="text-warning" />
              {t("dash.verifyEmail")}
            </span>
            <button
              className="inline-flex items-center gap-1 font-semibold text-warning hover:underline"
              onClick={() => navigate("/account")}
            >
              {t("dash.verifyNow")}
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        )}
        {checkoutNotice && (
          <div className="flex items-center justify-between gap-3 border-b border-accent/30 bg-accent/10 px-5 py-2 text-sm text-text">
            <span className="flex items-center gap-2">
              <Icon name="check_circle" size={16} className="text-accent" />
              {checkoutNotice}
            </span>
            <button
              className="rounded-full p-0.5 text-text-muted hover:bg-white/10 hover:text-text"
              onClick={() => setCheckoutNotice(null)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <header className="hidden items-center gap-3 border-b border-border bg-surface-2/40 px-6 py-4 md:flex">
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
              <Icon name={activeTab?.icon ?? "dashboard"} size={20} filled />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight text-text">
                {activeTab ? t(activeTab.labelKey) : "Documind AI"}
              </p>
              <p className="truncate text-xs text-text-muted">{t("dash.tagline")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </header>

        <nav className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-border bg-surface/60 px-4 py-2.5 md:px-6">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                tab === tabItem.key
                  ? "bg-accent/12 text-accent shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]"
                  : "text-text-muted hover:bg-white/5 hover:text-text"
              }`}
            >
              <Icon name={tabItem.icon} size={18} filled={tab === tabItem.key} />
              {t(tabItem.labelKey)}
            </button>
          ))}
        </nav>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <LoadingState label={t("dash.loadingWorkspace")} />
          ) : (
            <ErrorBoundary key={tab} fallbackTitle={t("dash.panelError")}>
              {tab === "chat" && <ChatPanel />}
              {tab === "summary" && (
                <GeneratePanel
                  title={t("dash.summaryTitle")}
                  endpoint="/generate/summary"
                  files={files}
                  buttonLabel={t("dash.summaryButton")}
                  loadingLabel={t("dash.summaryLoading")}
                  exportTitle={t("dash.tab.summary")}
                  exportFilenameSuffix="summary"
                />
              )}
              {tab === "notes" && (
                <GeneratePanel
                  title={t("dash.notesTitle")}
                  endpoint="/generate/notes"
                  files={files}
                  buttonLabel={t("dash.notesButton")}
                  loadingLabel={t("dash.notesLoading")}
                  exportTitle={t("dash.tab.notes")}
                  exportFilenameSuffix="study_notes"
                />
              )}
              {tab === "quiz" && <QuizPanel files={files} locked={isLocked("quiz")} />}
              {tab === "flashcards" && <FlashcardsPanel files={files} locked={isLocked("flashcards")} />}
              {tab === "compare" && <ComparePanel files={files} locked={isLocked("compare")} />}
              {tab === "research" && <ResearchPanel files={files} locked={isLocked("research")} />}
              {tab === "editor" && <PdfEditorPanel files={files} />}
              {tab === "formfiller" && <PdfFormFillerPanel files={files} />}
              {tab === "batch" && <BatchProcessPanel files={files} />}
              {tab === "agent" && <AgentPanel files={files} />}
              {tab === "automations" && <AutomationsPanel />}
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  )
}
