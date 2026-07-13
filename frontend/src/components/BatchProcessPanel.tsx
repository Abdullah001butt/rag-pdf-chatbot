import * as React from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"
import { DownloadButton } from "@/components/DownloadButton"
import { buildExportMarkdown } from "@/lib/export"
import { downloadFile } from "@/lib/export"

interface BatchProcessPanelProps {
  files: string[]
}

const ACTIONS = [
  { key: "summary", endpoint: "/generate/summary", label: "Summary", title: "Summary" },
  { key: "notes", endpoint: "/generate/notes", label: "Study Notes", title: "Study Notes" },
] as const

type ActionKey = (typeof ACTIONS)[number]["key"]

interface BatchResult {
  source: string
  status: "pending" | "running" | "done" | "error"
  result?: string
  error?: string
}

export function BatchProcessPanel({ files }: BatchProcessPanelProps) {
  const [action, setAction] = React.useState<ActionKey>("summary")
  const [selected, setSelected] = React.useState<Set<string>>(new Set(files))
  const [results, setResults] = React.useState<BatchResult[]>([])
  const [running, setRunning] = React.useState(false)

  React.useEffect(() => {
    setSelected(new Set(files))
  }, [files])

  function toggleFile(f: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  const actionInfo = ACTIONS.find((a) => a.key === action)!

  async function handleRun() {
    const targets = files.filter((f) => selected.has(f))
    if (targets.length === 0) return
    setRunning(true)
    setResults(targets.map((source) => ({ source, status: "pending" })))

    for (const source of targets) {
      setResults((prev) => prev.map((r) => (r.source === source ? { ...r, status: "running" } : r)))
      try {
        const { data } = await api.post(actionInfo.endpoint, { source })
        setResults((prev) => prev.map((r) => (r.source === source ? { ...r, status: "done", result: data.result } : r)))
      } catch (err: any) {
        const message = err?.response?.data?.detail || "Generation failed."
        setResults((prev) => prev.map((r) => (r.source === source ? { ...r, status: "error", error: message } : r)))
      }
    }
    setRunning(false)
  }

  function handleDownloadAll() {
    const done = results.filter((r) => r.status === "done" && r.result)
    if (done.length === 0) return
    const combined = done
      .map((r) => buildExportMarkdown(`${actionInfo.title} — ${r.source}`, { "Source Document": r.source }, r.result!))
      .join("\n\n")
    downloadFile(`batch_${action}_${done.length}_documents.md`, combined, "text/markdown")
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">Upload at least one PDF in the sidebar first.</p>
  }

  const doneCount = results.filter((r) => r.status === "done").length

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Batch Processing</h2>
      <p className="text-xs text-text-muted">
        Run the same action across multiple documents at once, then download each result or everything combined.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {ACTIONS.map((a) => (
          <Button key={a.key} variant={action === a.key ? "default" : "outline"} onClick={() => setAction(a.key)} disabled={running}>
            {a.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">Select documents ({selected.size} of {files.length})</span>
          <div className="flex gap-2">
            <button className="text-xs text-primary hover:underline" onClick={() => setSelected(new Set(files))} disabled={running}>
              Select all
            </button>
            <button className="text-xs text-primary hover:underline" onClick={() => setSelected(new Set())} disabled={running}>
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {files.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={selected.has(f)} onChange={() => toggleFile(f)} disabled={running} />
              {f}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleRun} disabled={running || selected.size === 0}>
          {running ? "Running..." : `Run ${actionInfo.label} on ${selected.size} document${selected.size === 1 ? "" : "s"}`}
        </Button>
        {doneCount > 0 && (
          <Button variant="outline" onClick={handleDownloadAll}>
            ⬇ Download All ({doneCount})
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <div key={r.source} className="rounded-2xl border border-white/10 bg-white/3 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-text">{r.source}</span>
                {r.status === "running" && <span className="text-xs text-text-muted">Generating...</span>}
                {r.status === "pending" && <span className="text-xs text-text-muted">Queued</span>}
                {r.status === "error" && <span className="text-xs text-danger">{r.error}</span>}
                {r.status === "done" && r.result && (
                  <DownloadButton
                    label="Download (.md)"
                    filename={`${r.source.replace(/\.[^/.]+$/, "")}_${action}.md`}
                    content={buildExportMarkdown(actionInfo.title, { "Source Document": r.source }, r.result)}
                  />
                )}
              </div>
              {r.status === "running" && <LoadingState label="" />}
              {r.status === "done" && r.result && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{r.result}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
