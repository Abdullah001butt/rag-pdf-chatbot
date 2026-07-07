import * as React from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/Spinner"
import { DownloadButton } from "@/components/DownloadButton"
import { buildExportMarkdown } from "@/lib/export"

interface ResearchPanelProps {
  files: string[]
  locked: boolean
}

export function ResearchPanel({ files, locked }: ResearchPanelProps) {
  const [topic, setTopic] = React.useState("")
  const [report, setReport] = React.useState<string | null>(null)
  const [subQuestions, setSubQuestions] = React.useState<string[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (locked) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm text-text">
        🔒 <strong>Research Assistant</strong> is available on the Pro plan. Upgrade from the sidebar to unlock it.
      </div>
    )
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">Upload at least one PDF in the sidebar first.</p>
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    setBusy(true)
    setError(null)
    setReport(null)
    setSubQuestions([])
    try {
      const { data } = await api.post("/generate/research", { topic })
      setReport(data.report)
      setSubQuestions(data.sub_questions || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Research generation failed. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Research Assistant</h2>

      <form onSubmit={handleRun} className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="e.g. How does encapsulation improve software maintainability?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={busy}
        />
        <Button type="submit" disabled={busy} className="shrink-0">
          {busy ? "Researching..." : "Run Research"}
        </Button>
      </form>

      {busy && (
        <LoadingState label="Decomposing the topic, retrieving evidence, and synthesizing a report — this can take a minute..." />
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {subQuestions.length > 0 && (
        <details className="rounded-2xl border border-border bg-white/5 p-4 text-sm text-text-muted">
          <summary className="cursor-pointer font-semibold text-text">Sub-questions investigated</summary>
          <ul className="mt-2 list-disc pl-5">
            {subQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </details>
      )}

      {report && (
        <>
          <div className="whitespace-pre-wrap rounded-2xl border border-border bg-white/5 p-5 text-sm leading-relaxed text-text">
            {report}
          </div>
          <div>
            <DownloadButton
              label="Download Research Report (.md)"
              filename="research_report.md"
              content={buildExportMarkdown(
                "Research Report",
                { Topic: topic },
                subQuestions.length
                  ? `${report}\n\n## Sub-questions Investigated\n\n${subQuestions.map((q) => `- ${q}`).join("\n")}`
                  : report
              )}
            />
          </div>
        </>
      )}
    </div>
  )
}
