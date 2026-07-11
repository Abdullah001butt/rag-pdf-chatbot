import * as React from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface PdfEditorPanelProps {
  files: string[]
}

interface TextItemInfo {
  key: string
  // Screen-space box for the overlay (pixels, at current render scale)
  left: number
  top: number
  width: number
  height: number
  // PDF-space data for flattening the edit into the export (independent of scale/zoom)
  pdfX: number
  pdfY: number
  pdfFontSize: number
  originalText: string
}

interface AddedText {
  id: string
  page: number
  left: number
  top: number
  pdfX: number
  pdfY: number
  text: string
}

export function PdfEditorPanel({ files }: PdfEditorPanelProps) {
  const [source, setSource] = React.useState(files[0] || "")
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null)
  const [pdfDoc, setPdfDoc] = React.useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(0)
  const [scale] = React.useState(1.4)
  const [textItems, setTextItems] = React.useState<TextItemInfo[]>([])
  const [edits, setEdits] = React.useState<Record<string, string>>({})
  const [addedTexts, setAddedTexts] = React.useState<AddedText[]>([])
  const [addingText, setAddingText] = React.useState(false)
  const [editingKey, setEditingKey] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!source && files.length > 0) setSource(files[0])
  }, [files, source])

  async function loadDocument(filename: string) {
    setLoading(true)
    setError(null)
    setEdits({})
    setAddedTexts([])
    setPageIndex(0)
    try {
      const { data } = await api.get("/documents/raw", {
        params: { filename },
        responseType: "arraybuffer",
      })
      setPdfBytes(data)
      const doc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
      setPdfDoc(doc)
      setPageCount(doc.numPages)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't load the document for editing.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (source) loadDocument(source)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  React.useEffect(() => {
    if (!pdfDoc) return
    renderPage(pageIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, pageIndex])

  async function renderPage(index: number) {
    if (!pdfDoc || !canvasRef.current) return
    const page = await pdfDoc.getPage(index + 1)
    const viewport = page.getViewport({ scale })
    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")!
    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    const textContent = await page.getTextContent()
    const items: TextItemInfo[] = []
    textContent.items.forEach((raw: any, i: number) => {
      if (!raw.str || !raw.str.trim()) return
      const tx = pdfjsLib.Util.transform(viewport.transform, raw.transform)
      const fontHeight = Math.hypot(tx[2], tx[3])
      const left = tx[4]
      const top = tx[5] - fontHeight
      const width = raw.width * scale

      const pdfFontSize = Math.hypot(raw.transform[2], raw.transform[3])
      items.push({
        key: `${index}-${i}`,
        left,
        top,
        width,
        height: fontHeight,
        pdfX: raw.transform[4],
        pdfY: raw.transform[5],
        pdfFontSize,
        originalText: raw.str,
      })
    })
    setTextItems(items)
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!addingText || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const left = e.clientX - rect.left
    const top = e.clientY - rect.top
    // Convert screen pixels back to PDF space for this page (inverse of render scale, flip Y).
    const canvas = canvasRef.current!
    const pdfX = left / scale
    const pdfY = (canvas.height - top) / scale
    const id = `added-${Date.now()}`
    setAddedTexts((prev) => [...prev, { id, page: pageIndex, left, top, pdfX, pdfY, text: "" }])
    setAddingText(false)
    setEditingKey(id)
  }

  async function handleExport() {
    if (!pdfBytes) return
    setExporting(true)
    setError(null)
    try {
      const doc = await PDFDocument.load(pdfBytes)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()

      textItems.forEach((item) => {
        const newText = edits[item.key]
        if (newText === undefined || newText === item.originalText) return
        const page = pages[pageIndex]
        // White-out the original text, then draw the replacement at the same baseline position.
        page.drawRectangle({
          x: item.pdfX - 1,
          y: item.pdfY - 2,
          width: (item.width / scale) + 2,
          height: item.pdfFontSize + 3,
          color: rgb(1, 1, 1),
        })
        page.drawText(newText, {
          x: item.pdfX,
          y: item.pdfY,
          size: item.pdfFontSize,
          font,
          color: rgb(0, 0, 0),
        })
      })

      addedTexts
        .filter((a) => a.text.trim())
        .forEach((a) => {
          const page = pages[a.page]
          page.drawText(a.text, {
            x: a.pdfX,
            y: a.pdfY,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          })
        })

      const editedBytes = await doc.save()
      const blob = new Blob([editedBytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${source.replace(/\.[^/.]+$/, "")}_edited.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError("Export failed: " + (err?.message || "unknown error"))
    } finally {
      setExporting(false)
    }
  }

  const editCount = Object.keys(edits).filter((k) => edits[k] !== textItems.find((t) => t.key === k)?.originalText).length
    + addedTexts.filter((a) => a.text.trim()).length

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">Upload at least one PDF in the sidebar first.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">PDF Editor</h2>
      <p className="text-xs text-text-muted">
        Click any text in the document to edit it, or use "Add Text" to place new text anywhere. This edits a visual
        copy of the page (best for fixing typos, dates, names) — it does not reflow surrounding text.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        >
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <Button
          variant={addingText ? "default" : "outline"}
          onClick={() => setAddingText((a) => !a)}
          disabled={loading || !pdfDoc}
        >
          {addingText ? "Click page to place text..." : "➕ Add Text"}
        </Button>
        <Button onClick={handleExport} disabled={exporting || !pdfDoc || editCount === 0}>
          {exporting ? "Exporting..." : `⬇ Download Edited PDF (${editCount} change${editCount === 1 ? "" : "s"})`}
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <LoadingState label="Loading document..." />}

      {pdfDoc && (
        <>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => p - 1)}
            >
              ⬅ Prev
            </Button>
            <span className="text-sm text-text-muted">
              Page {pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setPageIndex((p) => p + 1)}
            >
              Next ➡
            </Button>
          </div>

          <div className="overflow-auto rounded-2xl border border-white/10 bg-white/3 p-4">
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              className="relative mx-auto w-fit"
              style={{ cursor: addingText ? "crosshair" : "default" }}
            >
              <canvas ref={canvasRef} className="block" />

              {textItems.map((item) => {
                const isEditing = editingKey === item.key
                const currentValue = edits[item.key] ?? item.originalText
                const isChanged = edits[item.key] !== undefined && edits[item.key] !== item.originalText
                return isEditing ? (
                  <input
                    key={item.key}
                    autoFocus
                    value={currentValue}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    onBlur={() => setEditingKey(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingKey(null)
                    }}
                    style={{
                      position: "absolute",
                      left: item.left,
                      top: item.top,
                      width: Math.max(item.width, 40),
                      height: item.height,
                      fontSize: item.height * 0.85,
                      lineHeight: 1,
                      padding: 0,
                      border: "1px solid #10b981",
                      background: "white",
                      color: "black",
                    }}
                  />
                ) : (
                  <div
                    key={item.key}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!addingText) setEditingKey(item.key)
                    }}
                    title={item.originalText}
                    style={{
                      position: "absolute",
                      left: item.left,
                      top: item.top,
                      width: item.width,
                      height: item.height,
                      cursor: addingText ? "inherit" : "text",
                      background: isChanged ? "rgba(16,185,129,0.25)" : "transparent",
                      outline: isChanged ? "1px solid #10b981" : "none",
                    }}
                  />
                )
              })}

              {addedTexts
                .filter((a) => a.page === pageIndex)
                .map((a) =>
                  editingKey === a.id ? (
                    <input
                      key={a.id}
                      autoFocus
                      value={a.text}
                      onChange={(e) =>
                        setAddedTexts((prev) => prev.map((t) => (t.id === a.id ? { ...t, text: e.target.value } : t)))
                      }
                      onBlur={() => setEditingKey(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setEditingKey(null)
                      }}
                      style={{
                        position: "absolute",
                        left: a.left,
                        top: a.top - 14,
                        width: 160,
                        fontSize: 14,
                        border: "1px solid #10b981",
                        background: "white",
                        color: "black",
                      }}
                    />
                  ) : (
                    <div
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingKey(a.id)
                      }}
                      style={{
                        position: "absolute",
                        left: a.left,
                        top: a.top - 14,
                        fontSize: 14,
                        color: "#10b981",
                        fontWeight: 600,
                        cursor: "text",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.text || "(click to type)"}
                    </div>
                  )
                )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
