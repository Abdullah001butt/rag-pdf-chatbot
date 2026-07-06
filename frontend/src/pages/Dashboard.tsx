import * as React from "react"
import { api, type BillingStatus } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/Sidebar"
import { ChatPanel } from "@/components/ChatPanel"
import { GeneratePanel } from "@/components/GeneratePanel"
import { QuizPanel } from "@/components/QuizPanel"
import { FlashcardsPanel } from "@/components/FlashcardsPanel"
import { ComparePanel } from "@/components/ComparePanel"
import { ResearchPanel } from "@/components/ResearchPanel"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { LoadingState } from "@/components/Spinner"

const TABS = [
  { key: "chat", label: "💬 Chat" },
  { key: "summary", label: "📝 Summaries" },
  { key: "notes", label: "📖 Study Notes" },
  { key: "quiz", label: "❓ Quiz" },
  { key: "flashcards", label: "🗂 Flashcards" },
  { key: "compare", label: "🔀 Compare" },
  { key: "research", label: "🔎 Research" },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default function Dashboard() {
  const [tab, setTab] = React.useState<TabKey>("chat")
  const [files, setFiles] = React.useState<string[]>([])
  const [billing, setBilling] = React.useState<BillingStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [checkoutNotice, setCheckoutNotice] = React.useState<string | null>(null)
  const { refreshTier } = useAuth()

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
          setCheckoutNotice(data.tier === "pro" ? "🎉 You're now on the Pro plan!" : "Payment received — finishing setup...")
        } catch {
          setCheckoutNotice("We couldn't confirm your payment yet. It may still be processing.")
        }
      } else if (checkout === "cancelled") {
        setCheckoutNotice("Checkout was cancelled — you're still on the Free plan.")
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

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Documind AI" className="h-7 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="font-semibold text-text">Documind AI</span>
        </div>
        <button
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-text"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          {sidebarOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div className={`${sidebarOpen ? "block" : "hidden"} md:block`}>
        <Sidebar files={files} onFilesChanged={setFiles} billing={billing} onBillingChanged={setBilling} />
      </div>

      <main className="flex flex-1 flex-col overflow-hidden">
        {checkoutNotice && (
          <div className="flex items-center justify-between gap-3 border-b border-accent/30 bg-accent/10 px-5 py-2 text-sm text-text">
            <span>{checkoutNotice}</span>
            <button className="text-text-muted hover:text-text" onClick={() => setCheckoutNotice(null)}>
              ✕
            </button>
          </div>
        )}
        <header className="hidden items-center gap-3 border-b border-border p-5 md:flex">
          <img src="/logo.png" alt="Documind AI" className="h-8 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <p className="text-sm text-text-muted">Ask questions across multiple documents, powered by Gemini &amp; retrieval-augmented search</p>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-5 pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-white/5 text-text" : "text-text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <LoadingState label="Loading your workspace..." />
          ) : (
            <ErrorBoundary key={tab} fallbackTitle="This panel hit an error.">
              {tab === "chat" && <ChatPanel />}
              {tab === "summary" && (
                <GeneratePanel
                  title="Smart Summaries"
                  endpoint="/generate/summary"
                  files={files}
                  buttonLabel="Generate Summary"
                  loadingLabel="Summarizing your document..."
                  exportTitle="Summary"
                  exportFilenameSuffix="summary"
                />
              )}
              {tab === "notes" && (
                <GeneratePanel
                  title="AI Study Notes"
                  endpoint="/generate/notes"
                  files={files}
                  buttonLabel="Generate Study Notes"
                  loadingLabel="Building study notes..."
                  exportTitle="Study Notes"
                  exportFilenameSuffix="study_notes"
                />
              )}
              {tab === "quiz" && <QuizPanel files={files} locked={isLocked("quiz")} />}
              {tab === "flashcards" && <FlashcardsPanel files={files} locked={isLocked("flashcards")} />}
              {tab === "compare" && <ComparePanel files={files} locked={isLocked("compare")} />}
              {tab === "research" && <ResearchPanel files={files} locked={isLocked("research")} />}
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  )
}
