import * as React from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"
import { LoadingState } from "@/components/Spinner"

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface PdfCitationViewerProps {
  filename: string
  page: number
  jumpKey: number
  onClose: () => void
}

export function PdfCitationViewer({ filename, page, jumpKey, onClose }: PdfCitationViewerProps) {
  const { t } = useLanguage()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = React.useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [flash, setFlash] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get("/documents/raw", { params: { filename }, responseType: "arraybuffer" })
      .then(async ({ data }) => {
        if (cancelled) return
        const doc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
        if (cancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this document for preview.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename])

  const clampedPage = Math.min(Math.max(1, page), Math.max(1, numPages))

  React.useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let cancelled = false
    pdfDoc.getPage(clampedPage).then(async (pdfPage) => {
      if (cancelled || !canvasRef.current) return
      const viewport = pdfPage.getViewport({ scale: 1.2 })
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")!
      await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, clampedPage])

  React.useEffect(() => {
    if (jumpKey === 0) return
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), 900)
    return () => clearTimeout(timer)
  }, [jumpKey])

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
          <Icon name="picture_as_pdf" size={15} className="shrink-0 text-danger/80" />
          <span className="truncate">{filename}</span>
        </span>
        <button onClick={onClose} className="shrink-0 rounded-full p-1 text-text-muted hover:bg-white/10 hover:text-text">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="scrollbar-thin relative flex-1 overflow-auto p-3">
        {loading && <LoadingState label={t("common.generating")} />}
        {error && <p className="text-sm text-danger">{error}</p>}
        {!loading && !error && (
          <div
            className={`relative mx-auto w-fit rounded-lg transition-shadow duration-300 ${
              flash ? "shadow-[0_0_0_4px_rgba(16,185,129,0.6)]" : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            }`}
          >
            <canvas ref={canvasRef} className="block rounded-lg" />
            {flash && <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg bg-emerald-400/10" />}
          </div>
        )}
      </div>

      {numPages > 0 && (
        <div className="border-t border-border px-3 py-2 text-center text-xs text-text-muted">
          {t("chat.citationPage")} {clampedPage} / {numPages}
        </div>
      )}
    </div>
  )
}
