import * as React from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface PdfEditorPanelProps {
  files: string[]
}

interface TextItemInfo {
  key: string
  left: number
  top: number
  width: number
  height: number
  pdfX: number
  pdfY: number
  pdfFontSize: number
  originalText: string
}

interface TextStyle {
  fontSize: number
  bold: boolean
  color: string // hex
}

interface AddedText {
  id: string
  pageEntryId: string
  left: number
  top: number
  pdfX: number
  pdfY: number
  text: string
  style: TextStyle
}

type PageEntry = { id: string; type: "page"; origIndex: number } | { id: string; type: "blank" }

const DEFAULT_STYLE: TextStyle = { fontSize: 12, bold: false, color: "#000000" }

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

export function PdfEditorPanel({ files }: PdfEditorPanelProps) {
  const [source, setSource] = React.useState(files[0] || "")
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null)
  const [pdfDoc, setPdfDoc] = React.useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pageOrder, setPageOrder] = React.useState<PageEntry[]>([])
  const [currentPos, setCurrentPos] = React.useState(0)
  const [scale] = React.useState(1.4)
  const [pageTextItems, setPageTextItems] = React.useState<Record<number, TextItemInfo[]>>({})
  const [pageSizes, setPageSizes] = React.useState<Record<number, { width: number; height: number }>>({})
  const [edits, setEdits] = React.useState<Record<string, string>>({})
  const [editStyles, setEditStyles] = React.useState<Record<string, TextStyle>>({})
  const [addedTexts, setAddedTexts] = React.useState<AddedText[]>([])
  const [addingText, setAddingText] = React.useState(false)
  const [editingKey, setEditingKey] = React.useState<string | null>(null)
  const [activeStyle, setActiveStyle] = React.useState<TextStyle>(DEFAULT_STYLE)
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
    setEditStyles({})
    setAddedTexts([])
    setPageTextItems({})
    setPageSizes({})
    setCurrentPos(0)
    try {
      const { data } = await api.get("/documents/raw", {
        params: { filename },
        responseType: "arraybuffer",
      })
      setPdfBytes(data)
      const doc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
      setPdfDoc(doc)
      setPageOrder(
        Array.from({ length: doc.numPages }, (_, i) => ({ id: `orig-${i}`, type: "page" as const, origIndex: i }))
      )
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

  const currentEntry = pageOrder[currentPos]

  React.useEffect(() => {
    if (!pdfDoc || !currentEntry) return
    if (currentEntry.type === "page") {
      renderOriginalPage(currentEntry.origIndex)
    } else {
      renderBlankPage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPos, pageOrder])

  async function renderOriginalPage(origIndex: number) {
    if (!pdfDoc || !canvasRef.current) return
    const page = await pdfDoc.getPage(origIndex + 1)
    const viewport = page.getViewport({ scale })
    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")!
    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    setPageSizes((prev) => ({ ...prev, [origIndex]: { width: viewport.width / scale, height: viewport.height / scale } }))

    if (pageTextItems[origIndex]) return // already extracted

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
        key: `${origIndex}-${i}`,
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
    setPageTextItems((prev) => ({ ...prev, [origIndex]: items }))
  }

  function renderBlankPage() {
    const canvas = canvasRef.current
    if (!canvas) return
    const refSize = Object.values(pageSizes)[0] || { width: 612, height: 792 }
    canvas.width = refSize.width * scale
    canvas.height = refSize.height * scale
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!addingText || !containerRef.current || !currentEntry) return
    const rect = containerRef.current.getBoundingClientRect()
    const left = e.clientX - rect.left
    const top = e.clientY - rect.top
    const pdfX = left / scale
    const pdfY = (canvasRef.current!.height - top) / scale
    const id = `added-${Date.now()}`
    setAddedTexts((prev) => [
      ...prev,
      { id, pageEntryId: currentEntry.id, left, top, pdfX, pdfY, text: "", style: { ...activeStyle } },
    ])
    setAddingText(false)
    setEditingKey(id)
  }

  function deleteExistingText(key: string) {
    setEdits((prev) => ({ ...prev, [key]: "" }))
    setEditingKey(null)
  }

  function movePosition(delta: number) {
    setCurrentPos((p) => Math.max(0, Math.min(pageOrder.length - 1, p + delta)))
  }

  function deleteCurrentPage() {
    if (pageOrder.length <= 1) {
      setError("Can't delete the only remaining page.")
      return
    }
    setPageOrder((prev) => prev.filter((_, i) => i !== currentPos))
    setCurrentPos((p) => Math.max(0, Math.min(p, pageOrder.length - 2)))
  }

  function insertBlankPage() {
    const id = `blank-${Date.now()}`
    setPageOrder((prev) => {
      const next = [...prev]
      next.splice(currentPos + 1, 0, { id, type: "blank" })
      return next
    })
    setCurrentPos((p) => p + 1)
  }

  function reorderPage(delta: number) {
    setPageOrder((prev) => {
      const next = [...prev]
      const target = currentPos + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[currentPos], next[target]] = [next[target], next[currentPos]]
      return next
    })
    setCurrentPos((p) => p + delta)
  }

  async function handleExport() {
    if (!pdfBytes) return
    setExporting(true)
    setError(null)
    try {
      const originalDoc = await PDFDocument.load(pdfBytes)
      const newDoc = await PDFDocument.create()
      const font = await newDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await newDoc.embedFont(StandardFonts.HelveticaBold)

      // Copy/insert pages in the user's chosen order, tracking original -> new index.
      const origToNewIndex: Record<number, number> = {}
      const blankSize: [number, number] = (() => {
        const ref = Object.values(pageSizes)[0]
        return ref ? [ref.width, ref.height] : [612, 792]
      })()

      for (const entry of pageOrder) {
        if (entry.type === "page") {
          const [copied] = await newDoc.copyPages(originalDoc, [entry.origIndex])
          newDoc.addPage(copied)
          origToNewIndex[entry.origIndex] = newDoc.getPageCount() - 1
        } else {
          newDoc.addPage(blankSize)
        }
      }

      const pages = newDoc.getPages()

      // Apply edits to existing text (white-out + redraw) for every visited original page.
      Object.entries(pageTextItems).forEach(([origIndexStr, items]) => {
        const origIndex = Number(origIndexStr)
        const newIndex = origToNewIndex[origIndex]
        if (newIndex === undefined) return // page was deleted
        const page = pages[newIndex]
        items.forEach((item) => {
          const newText = edits[item.key]
          if (newText === undefined || newText === item.originalText) return
          const style = editStyles[item.key]
          const size = style?.fontSize ?? item.pdfFontSize
          const useFont = style?.bold ? boldFont : font
          const color = style ? hexToRgb(style.color) : rgb(0, 0, 0)
          page.drawRectangle({
            x: item.pdfX - 1,
            y: item.pdfY - 2,
            width: item.width / scale + 2,
            height: item.pdfFontSize + 3,
            color: rgb(1, 1, 1),
          })
          if (newText.trim()) {
            page.drawText(newText, { x: item.pdfX, y: item.pdfY, size, font: useFont, color })
          }
        })
      })

      // Draw added text boxes.
      addedTexts
        .filter((a) => a.text.trim())
        .forEach((a) => {
          const entry = pageOrder.find((e) => e.id === a.pageEntryId)
          if (!entry) return
          const newIndex = entry.type === "page" ? origToNewIndex[entry.origIndex] : pageOrder.indexOf(entry)
          const page = pages[newIndex]
          if (!page) return
          const useFont = a.style.bold ? boldFont : font
          page.drawText(a.text, { x: a.pdfX, y: a.pdfY, size: a.style.fontSize, font: useFont, color: hexToRgb(a.style.color) })
        })

      const editedBytes = await newDoc.save()
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

  const textItems = currentEntry?.type === "page" ? pageTextItems[currentEntry.origIndex] || [] : []
  const currentAddedTexts = currentEntry ? addedTexts.filter((a) => a.pageEntryId === currentEntry.id) : []

  const changeCount =
    Object.keys(edits).filter((k) => {
      const [origIdx, i] = k.split("-").map(Number)
      const item = (pageTextItems[origIdx] || [])[i]
      return item && edits[k] !== item.originalText
    }).length + addedTexts.filter((a) => a.text.trim()).length

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">Upload at least one PDF in the sidebar first.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">PDF Editor</h2>
      <p className="text-xs text-text-muted">
        Click text to edit or delete it, add new text, manage pages, and style what you add — then export a flattened
        copy. Best for simple fixes (typos, dates, names, redactions); it does not reflow surrounding text.
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
        <Button onClick={handleExport} disabled={exporting || !pdfDoc || changeCount === 0}>
          {exporting ? "Exporting..." : `⬇ Download Edited PDF (${changeCount} change${changeCount === 1 ? "" : "s"})`}
        </Button>
      </div>

      {/* Style toolbar — applies to new text added and to the item currently being edited */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs text-text-muted">
        <span className="font-semibold text-text">Style for new/edited text:</span>
        <label className="flex items-center gap-1">
          Size
          <input
            type="number"
            min={6}
            max={72}
            value={activeStyle.fontSize}
            onChange={(e) => {
              const fontSize = Number(e.target.value)
              setActiveStyle((s) => ({ ...s, fontSize }))
              if (editingKey) setEditStyles((prev) => ({ ...prev, [editingKey]: { ...activeStyle, fontSize } }))
            }}
            className="w-14 rounded border border-border bg-surface px-1.5 py-0.5 text-text"
          />
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={activeStyle.bold}
            onChange={(e) => {
              const bold = e.target.checked
              setActiveStyle((s) => ({ ...s, bold }))
              if (editingKey) setEditStyles((prev) => ({ ...prev, [editingKey]: { ...activeStyle, bold } }))
            }}
          />
          Bold
        </label>
        <label className="flex items-center gap-1">
          Color
          <input
            type="color"
            value={activeStyle.color}
            onChange={(e) => {
              const color = e.target.value
              setActiveStyle((s) => ({ ...s, color }))
              if (editingKey) setEditStyles((prev) => ({ ...prev, [editingKey]: { ...activeStyle, color } }))
            }}
            className="h-6 w-8 rounded border border-border bg-surface"
          />
        </label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <LoadingState label="Loading document..." />}

      {pdfDoc && currentEntry && (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" disabled={currentPos === 0} onClick={() => movePosition(-1)}>
              ⬅ Prev
            </Button>
            <span className="text-sm text-text-muted">
              Page {currentPos + 1} / {pageOrder.length}
              {currentEntry.type === "blank" && " (blank)"}
            </span>
            <Button variant="outline" disabled={currentPos >= pageOrder.length - 1} onClick={() => movePosition(1)}>
              Next ➡
            </Button>

            <span className="mx-1 h-4 w-px bg-border" />

            <Button variant="outline" disabled={currentPos === 0} onClick={() => reorderPage(-1)} title="Move page up">
              ↑ Move
            </Button>
            <Button
              variant="outline"
              disabled={currentPos >= pageOrder.length - 1}
              onClick={() => reorderPage(1)}
              title="Move page down"
            >
              ↓ Move
            </Button>
            <Button variant="outline" onClick={insertBlankPage}>
              ➕ Blank Page
            </Button>
            <Button variant="destructive" onClick={deleteCurrentPage}>
              🗑 Delete Page
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
                const isDeleted = edits[item.key] === ""
                const isChanged = edits[item.key] !== undefined && edits[item.key] !== item.originalText
                return isEditing ? (
                  <div key={item.key} style={{ position: "absolute", left: item.left, top: item.top }}>
                    <input
                      autoFocus
                      value={currentValue}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))}
                      onBlur={() => setEditingKey(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setEditingKey(null)
                      }}
                      style={{
                        width: Math.max(item.width, 60),
                        height: item.height,
                        fontSize: item.height * 0.85,
                        lineHeight: 1,
                        padding: 0,
                        border: "1px solid #10b981",
                        background: "white",
                        color: "black",
                      }}
                    />
                    <button
                      onClick={() => deleteExistingText(item.key)}
                      title="Delete this text"
                      style={{
                        position: "absolute",
                        left: Math.max(item.width, 60) + 2,
                        top: 0,
                        fontSize: 11,
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        padding: "1px 4px",
                        cursor: "pointer",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ) : (
                  <div
                    key={item.key}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!addingText) {
                        setEditingKey(item.key)
                        setActiveStyle(editStyles[item.key] || { ...DEFAULT_STYLE, fontSize: item.pdfFontSize })
                      }
                    }}
                    title={isDeleted ? "(deleted)" : item.originalText}
                    style={{
                      position: "absolute",
                      left: item.left,
                      top: item.top,
                      width: item.width,
                      height: item.height,
                      cursor: addingText ? "inherit" : "text",
                      background: isDeleted ? "rgba(239,68,68,0.25)" : isChanged ? "rgba(16,185,129,0.25)" : "transparent",
                      outline: isDeleted ? "1px solid #ef4444" : isChanged ? "1px solid #10b981" : "none",
                    }}
                  />
                )
              })}

              {currentAddedTexts.map((a) =>
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
                      top: a.top - a.style.fontSize,
                      width: 180,
                      fontSize: a.style.fontSize,
                      fontWeight: a.style.bold ? 700 : 400,
                      color: a.style.color,
                      border: "1px solid #10b981",
                      background: "white",
                    }}
                  />
                ) : (
                  <div
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingKey(a.id)
                      setActiveStyle(a.style)
                    }}
                    style={{
                      position: "absolute",
                      left: a.left,
                      top: a.top - a.style.fontSize,
                      fontSize: a.style.fontSize,
                      fontWeight: a.style.bold ? 700 : 400,
                      color: a.style.color,
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
