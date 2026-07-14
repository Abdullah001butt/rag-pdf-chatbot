import * as React from "react"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"
import { DownloadButton } from "@/components/DownloadButton"
import { buildExportMarkdown } from "@/lib/export"

interface GeneratePanelProps {
  title: string
  endpoint: string
  files: string[]
  buttonLabel: string
  loadingLabel: string
  exportTitle: string
  exportFilenameSuffix: string
}

export function GeneratePanel({
  title,
  endpoint,
  files,
  buttonLabel,
  loadingLabel,
  exportTitle,
  exportFilenameSuffix,
}: GeneratePanelProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [source, setSource] = React.useState(files[0] || "")
  const [result, setResult] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!source && files.length > 0) setSource(files[0])
  }, [files, source])

  async function handleGenerate() {
    if (!source) return
    setBusy(true)
    setResult(null)
    try {
      const { data } = await api.post(endpoint, { source })
      setResult(data.result)
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Generation failed. Please try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">{t("common.uploadFirst")}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={busy}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        >
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <Button onClick={handleGenerate} disabled={busy} className="shrink-0">
          {busy ? t("common.generating") : buttonLabel}
        </Button>
      </div>

      {busy && <LoadingState label={loadingLabel} />}

      {result && (
        <>
          <div className="whitespace-pre-wrap rounded-2xl border border-border bg-white/3 p-5 text-sm leading-relaxed text-text">
            {result}
          </div>
          <div>
            <DownloadButton
              label={`${t("common.download")} ${exportTitle} (.md)`}
              filename={`${source.replace(/\.[^/.]+$/, "")}_${exportFilenameSuffix}.md`}
              content={buildExportMarkdown(exportTitle, { [t("common.sourceDocument")]: source }, result)}
            />
          </div>
        </>
      )}
    </div>
  )
}
