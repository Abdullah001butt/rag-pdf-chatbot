import * as React from "react"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"
import { DownloadButton } from "@/components/DownloadButton"
import { buildExportMarkdown } from "@/lib/export"

interface ComparePanelProps {
  files: string[]
  locked: boolean
}

export function ComparePanel({ files, locked }: ComparePanelProps) {
  const { t } = useLanguage()
  const [sourceA, setSourceA] = React.useState(files[0] || "")
  const [sourceB, setSourceB] = React.useState(files[1] || "")
  const [result, setResult] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!sourceA && files[0]) setSourceA(files[0])
    if (!sourceB && files[1]) setSourceB(files[1])
  }, [files, sourceA, sourceB])

  if (locked) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm text-text">
        {t("compare.locked")}
      </div>
    )
  }

  if (files.length < 2) {
    return <p className="text-sm text-text-muted">{t("compare.uploadTwo")}</p>
  }

  async function handleCompare() {
    if (sourceA === sourceB) {
      setError(t("compare.chooseDifferent"))
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.post("/generate/compare", { source_a: sourceA, source_b: sourceB })
      setResult(data.result)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Comparison failed. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("compare.title")}</h2>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={sourceA}
          onChange={(e) => setSourceA(e.target.value)}
          disabled={busy}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        >
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={sourceB}
          onChange={(e) => setSourceB(e.target.value)}
          disabled={busy}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        >
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <Button onClick={handleCompare} disabled={busy} className="shrink-0">
          {busy ? t("compare.running") : t("compare.run")}
        </Button>
      </div>

      {busy && <LoadingState label={t("compare.running")} />}
      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <>
          <div className="whitespace-pre-wrap rounded-2xl border border-border bg-white/5 p-5 text-sm leading-relaxed text-text">
            {result}
          </div>
          <div>
            <DownloadButton
              label={t("compare.download")}
              filename={`comparison_${sourceA.replace(/\.[^/.]+$/, "")}_vs_${sourceB.replace(/\.[^/.]+$/, "")}.md`}
              content={buildExportMarkdown(t("compare.title"), { [t("compare.docA")]: sourceA, [t("compare.docB")]: sourceB }, result)}
            />
          </div>
        </>
      )}
    </div>
  )
}
