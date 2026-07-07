import * as React from "react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Turn {
  question: string
  answer: string
  citations: string[]
  notFound: boolean
}

export function ChatPanel() {
  const [question, setQuestion] = React.useState("")
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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
    setError(null)
    const q = question
    setQuestion("")
    try {
      const { data } = await api.post("/chat/ask", { question: q })
      setTurns((prev) => [...prev, { question: q, answer: data.answer, citations: data.citations, notFound: data.not_found }])
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <form onSubmit={handleAsk} className="flex gap-2">
        <Input
          placeholder="Ask a question from your PDF files..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy}
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Thinking..." : "Ask"}
        </Button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3 overflow-y-auto">
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
                    ⚠ Not in document
                  </div>
                )}
                <div className="whitespace-pre-wrap">{turn.answer}</div>
                {!turn.notFound && turn.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {turn.citations.map((c, ci) => (
                      <span key={ci} className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-text-muted">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {turns.length === 0 && <p className="text-sm text-text-muted">Ask your first question to get started.</p>}
      </div>
    </div>
  )
}
