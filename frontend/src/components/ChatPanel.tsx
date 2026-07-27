import * as React from "react"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { useToast } from "@/context/ToastContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { PdfCitationViewer } from "@/components/PdfCitationViewer"

interface Turn {
  question: string
  answer: string
  citations: string[]
  notFound: boolean
}

const CITATION_RE = /^(.*) · p\.(\d+)$/

function parseCitation(raw: string): { source: string; page: number } | null {
  const m = raw.match(CITATION_RE)
  if (!m) return null
  return { source: m[1], page: parseInt(m[2], 10) }
}

export function ChatPanel() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [question, setQuestion] = React.useState("")
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [busy, setBusy] = React.useState(false)
  const [preview, setPreview] = React.useState<{ source: string; page: number } | null>(null)
  const [jumpKey, setJumpKey] = React.useState(0)

  function handleCitationClick(raw: string) {
    const parsed = parseCitation(raw)
    if (!parsed) return
    setPreview(parsed)
    setJumpKey((k) => k + 1)
  }

  React.useEffect(() => {
    api.get("/chat/history").then(({ data }) => {
      setTurns(
        data.map((row: any) => ({
          question: row.question,
          answer: row.answer,
          citations: row.citations ? row.citations.split("; ").filter(Boolean) : [],
          notFound: row.answer.toLowerCase().includes("answer is not available in the context"),
        }))
      )
    }).catch(() => {})
  }, [])

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setBusy(true)
    const q = question
    setQuestion("")
    try {
      const { data } = await api.post("/chat/ask", { question: q })
      setTurns((prev) => [...prev, { question: q, answer: data.answer, citations: data.citations, notFound: data.not_found }])
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Something went wrong.", "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full gap-4">
      <div className={`flex h-full flex-col gap-4 ${preview ? "hidden lg:flex lg:w-1/2" : "flex-1"}`}>
        <form onSubmit={handleAsk} className="flex gap-2">
          <Input
            placeholder={t("chat.placeholder")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={busy}
          />
          <Button type="submit" disabled={busy}>
            {busy ? t("chat.thinking") : t("chat.ask")}
          </Button>
        </form>

        <div className="scrollbar-thin flex flex-col gap-3 overflow-y-auto">
          {[...turns].reverse().map((turn, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex gap-3 rounded-2xl border border-white/10 bg-accent/10 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">U</div>
                <div className="text-sm text-text">{turn.question}</div>
              </div>
              <div
                className={`flex gap-3 rounded-2xl border p-4 ${
                  turn.notFound ? "border-warning/30 bg-warning/10" : "border-white/10 bg-white/3"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2a2f3d] text-xs font-bold text-white">
                  AI
                </div>
                <div className="text-sm text-text">
                  {turn.notFound && (
                    <div className="mb-2 inline-block rounded-md border border-warning/35 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                      {t("chat.notInDoc")}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{turn.answer}</div>
                  {!turn.notFound && turn.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {turn.citations.map((c, ci) => {
                        const parsed = parseCitation(c)
                        const isActive = parsed && preview?.source === parsed.source && preview?.page === parsed.page
                        return (
                          <button
                            key={ci}
                            onClick={() => handleCitationClick(c)}
                            disabled={!parsed}
                            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                              isActive
                                ? "border-accent bg-accent/20 text-accent"
                                : "border-accent/30 bg-accent/10 text-text-muted hover:bg-accent/15 hover:text-text"
                            }`}
                          >
                            <Icon name="my_location" size={12} />
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {turns.length === 0 && <p className="text-sm text-text-muted">{t("chat.emptyState")}</p>}
        </div>
      </div>

      {preview && (
        <div className="w-full lg:w-1/2">
          <PdfCitationViewer
            filename={preview.source}
            page={preview.page}
            jumpKey={jumpKey}
            onClose={() => setPreview(null)}
          />
        </div>
      )}
    </div>
  )
}
