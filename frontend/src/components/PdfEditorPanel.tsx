import * as React from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"
import { Icon } from "@/components/ui/icon"

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

interface AddedSignature {
  id: string
  pageEntryId: string
  left: number
  top: number
  pdfX: number
  pdfYTop: number
  widthPdf: number
  heightPdf: number
  widthPx: number
  heightPx: number
  dataUrl: string
}

interface VersionInfo {
  id: number
  filename: string
  version_number: number
  label: string
  size_bytes: number
  created_at: string
}

type PageEntry = { id: string; type: "page"; origIndex: number } | { id: string; type: "blank" }

const DEFAULT_STYLE: TextStyle = { fontSize: 12, bold: false, color: "#000000" }

const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, // phone
  /\b(?:\d[ -]?){13,16}\b/, // credit-card-like
]

const REWRITE_ACTION_KEYS = [
  { labelKey: "editorPanel.rewriteFixGrammar", instructionKey: "editorPanel.rewriteFixGrammarInstruction" },
  { labelKey: "editorPanel.rewriteFormal", instructionKey: "editorPanel.rewriteFormalInstruction" },
  { labelKey: "editorPanel.rewriteCasual", instructionKey: "editorPanel.rewriteCasualInstruction" },
]

const SIG_CANVAS_WIDTH = 400
const SIG_CANVAS_HEIGHT = 150
const SIG_PLACE_WIDTH = 180
const SIG_PLACE_HEIGHT = (SIG_PLACE_WIDTH * SIG_CANVAS_HEIGHT) / SIG_CANVAS_WIDTH

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

export function PdfEditorPanel({ files }: PdfEditorPanelProps) {
  const { t } = useLanguage()
  const REWRITE_ACTIONS = REWRITE_ACTION_KEYS.map((a) => ({ label: t(a.labelKey), instruction: t(a.instructionKey) }))
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
  const [aiBusyKey, setAiBusyKey] = React.useState<string | null>(null)
  const [redacting, setRedacting] = React.useState(false)
  const [ocrProcessedPages, setOcrProcessedPages] = React.useState<Set<number>>(new Set())
  const [ocrBusy, setOcrBusy] = React.useState(false)
  const [addedSignatures, setAddedSignatures] = React.useState<AddedSignature[]>([])
  const [selectedSigId, setSelectedSigId] = React.useState<string | null>(null)
  const [sigModalOpen, setSigModalOpen] = React.useState(false)
  const [sigTab, setSigTab] = React.useState<"draw" | "type">("draw")
  const [typedSigText, setTypedSigText] = React.useState("")
  const [placingSignature, setPlacingSignature] = React.useState<{ dataUrl: string; widthPx: number; heightPx: number } | null>(null)
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [versionsOpen, setVersionsOpen] = React.useState(false)
  const [versions, setVersions] = React.useState<VersionInfo[]>([])
  const [versionsLoading, setVersionsLoading] = React.useState(false)
  const [savingVersion, setSavingVersion] = React.useState(false)
  const [versionLabel, setVersionLabel] = React.useState("")

  const sigCanvasRef = React.useRef<HTMLCanvasElement>(null)

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
    setOcrProcessedPages(new Set())
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
      setError(err?.response?.data?.detail || t("editorPanel.errLoadDocument"))
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
    if (!containerRef.current || !currentEntry) return
    const rect = containerRef.current.getBoundingClientRect()
    const left = e.clientX - rect.left
    const top = e.clientY - rect.top

    if (placingSignature) {
      const pdfX = left / scale
      const pdfYTop = (canvasRef.current!.height - top) / scale
      const id = `sig-${Date.now()}`
      setAddedSignatures((prev) => [
        ...prev,
        {
          id,
          pageEntryId: currentEntry.id,
          left,
          top,
          pdfX,
          pdfYTop,
          widthPdf: placingSignature.widthPx / scale,
          heightPdf: placingSignature.heightPx / scale,
          widthPx: placingSignature.widthPx,
          heightPx: placingSignature.heightPx,
          dataUrl: placingSignature.dataUrl,
        },
      ])
      setPlacingSignature(null)
      return
    }

    if (!addingText) return
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

  function deleteSignature(id: string) {
    setAddedSignatures((prev) => prev.filter((s) => s.id !== id))
    setSelectedSigId(null)
  }

  function resizeSignature(id: string, factor: number) {
    setAddedSignatures((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              widthPx: s.widthPx * factor,
              heightPx: s.heightPx * factor,
              widthPdf: s.widthPdf * factor,
              heightPdf: s.heightPdf * factor,
            }
          : s
      )
    )
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")!
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    setIsDrawing(true)
  }

  function drawStroke(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")!
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.strokeStyle = "#000000"
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  function stopDrawing() {
    setIsDrawing(false)
  }

  function clearSigCanvas() {
    const canvas = sigCanvasRef.current
    if (!canvas) return
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
  }

  function confirmDrawnSignature() {
    const canvas = sigCanvasRef.current
    if (!canvas) return
    setPlacingSignature({ dataUrl: canvas.toDataURL("image/png"), widthPx: SIG_PLACE_WIDTH, heightPx: SIG_PLACE_HEIGHT })
    setSigModalOpen(false)
    setAddingText(false)
  }

  function confirmTypedSignature() {
    if (!typedSigText.trim()) return
    const canvas = document.createElement("canvas")
    canvas.width = SIG_CANVAS_WIDTH
    canvas.height = SIG_CANVAS_HEIGHT
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = "60px 'Segoe Script', 'Brush Script MT', cursive"
    ctx.fillStyle = "#000000"
    ctx.textBaseline = "middle"
    ctx.fillText(typedSigText, 15, canvas.height / 2)
    setPlacingSignature({ dataUrl: canvas.toDataURL("image/png"), widthPx: SIG_PLACE_WIDTH, heightPx: SIG_PLACE_HEIGHT })
    setSigModalOpen(false)
    setAddingText(false)
  }

  function deleteExistingText(key: string) {
    setEdits((prev) => ({ ...prev, [key]: "" }))
    setEditingKey(null)
  }

  async function handleOcrPage(origIndex: number) {
    const pageSize = pageSizes[origIndex]
    if (!pageSize) return
    setOcrBusy(true)
    setError(null)
    try {
      const { data } = await api.post("/documents/ocr-page-boxes", null, {
        params: { filename: source, page_index: origIndex },
      })
      const items: TextItemInfo[] = (data.boxes || []).map((box: any, i: number) => {
        const boxWidthPdf = box.width * pageSize.width
        const boxHeightPdf = box.height * pageSize.height
        const boxLeftPdf = box.x * pageSize.width
        const boxTopFromTopPdf = box.y * pageSize.height
        const pdfY = pageSize.height - boxTopFromTopPdf - boxHeightPdf
        return {
          key: `${origIndex}-${i}`,
          left: boxLeftPdf * scale,
          top: boxTopFromTopPdf * scale,
          width: boxWidthPdf * scale,
          height: boxHeightPdf * scale,
          pdfX: boxLeftPdf,
          pdfY,
          pdfFontSize: boxHeightPdf * 0.85,
          originalText: box.text,
        }
      })
      setPageTextItems((prev) => ({ ...prev, [origIndex]: items }))
      setOcrProcessedPages((prev) => new Set(prev).add(origIndex))
    } catch (err: any) {
      setError(err?.response?.data?.detail || t("editorPanel.errOcrFailed"))
    } finally {
      setOcrBusy(false)
    }
  }

  async function handleAiRewrite(key: string, instruction: string, isAdded: boolean) {
    const text = isAdded ? addedTexts.find((a) => a.id === key)?.text : edits[key]
    if (!text || !text.trim()) return
    setAiBusyKey(key)
    setError(null)
    try {
      const { data } = await api.post("/generate/rewrite-text", { text, instruction })
      if (isAdded) {
        setAddedTexts((prev) => prev.map((a) => (a.id === key ? { ...a, text: data.result } : a)))
      } else {
        setEdits((prev) => ({ ...prev, [key]: data.result }))
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || t("editorPanel.errRewriteFailed"))
    } finally {
      setAiBusyKey(null)
    }
  }

  function handleAutoRedactPII() {
    setRedacting(true)
    setError(null)
    let count = 0
    const newEdits: Record<string, string> = {}
    Object.values(pageTextItems)
      .flat()
      .forEach((item) => {
        const current = edits[item.key] ?? item.originalText
        if (current && PII_PATTERNS.some((p) => p.test(current))) {
          newEdits[item.key] = ""
          count++
        }
      })
    setEdits((prev) => ({ ...prev, ...newEdits }))
    setError(count > 0 ? null : t("editorPanel.noPiiFound"))
    setRedacting(false)
  }

  function movePosition(delta: number) {
    setCurrentPos((p) => Math.max(0, Math.min(pageOrder.length - 1, p + delta)))
  }

  function deleteCurrentPage() {
    if (pageOrder.length <= 1) {
      setError(t("editorPanel.errDeleteOnlyPage"))
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

  async function buildExportedPdfBytes(): Promise<Uint8Array> {
    if (!pdfBytes) throw new Error("No document loaded.")
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

      // Draw placed signatures.
      const embeddedImages: Record<string, Awaited<ReturnType<typeof newDoc.embedPng>>> = {}
      for (const sig of addedSignatures) {
        const entry = pageOrder.find((e) => e.id === sig.pageEntryId)
        if (!entry) continue
        const newIndex = entry.type === "page" ? origToNewIndex[entry.origIndex] : pageOrder.indexOf(entry)
        const page = pages[newIndex]
        if (!page) continue
        if (!embeddedImages[sig.dataUrl]) {
          embeddedImages[sig.dataUrl] = await newDoc.embedPng(dataUrlToUint8Array(sig.dataUrl))
        }
        page.drawImage(embeddedImages[sig.dataUrl], {
          x: sig.pdfX,
          y: sig.pdfYTop - sig.heightPdf,
          width: sig.widthPdf,
          height: sig.heightPdf,
        })
      }

    return newDoc.save()
  }

  async function handleExport() {
    setExporting(true)
    setError(null)
    try {
      const editedBytes = await buildExportedPdfBytes()
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
      setError(`${t("editorPanel.errExportFailed")} ` + (err?.message || "unknown error"))
    } finally {
      setExporting(false)
    }
  }

  async function handleSaveVersion() {
    setSavingVersion(true)
    setError(null)
    try {
      const editedBytes = await buildExportedPdfBytes()
      const blob = new Blob([editedBytes as BlobPart], { type: "application/pdf" })
      const formData = new FormData()
      formData.append("filename", source)
      formData.append("label", versionLabel)
      formData.append("file", blob, `${source.replace(/\.[^/.]+$/, "")}_version.pdf`)
      await api.post("/versions/save", formData, { headers: { "Content-Type": "multipart/form-data" } })
      setVersionLabel("")
      if (versionsOpen) await loadVersions()
    } catch (err: any) {
      setError(err?.response?.data?.detail || `${t("editorPanel.errExportFailed")} ` + (err?.message || "unknown error"))
    } finally {
      setSavingVersion(false)
    }
  }

  async function loadVersions() {
    setVersionsLoading(true)
    try {
      const { data } = await api.get("/versions", { params: { filename: source } })
      setVersions(data.versions || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't load versions.")
    } finally {
      setVersionsLoading(false)
    }
  }

  function openVersions() {
    setVersionsOpen(true)
    loadVersions()
  }

  async function handleRestoreVersion(versionId: number) {
    setError(null)
    try {
      const { data } = await api.get(`/versions/${versionId}/download`, { responseType: "arraybuffer" })
      setPdfBytes(data)
      const doc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
      setPdfDoc(doc)
      setPageOrder(
        Array.from({ length: doc.numPages }, (_, i) => ({ id: `orig-${i}`, type: "page" as const, origIndex: i }))
      )
      setEdits({})
      setEditStyles({})
      setAddedTexts([])
      setAddedSignatures([])
      setPageTextItems({})
      setPageSizes({})
      setCurrentPos(0)
      setOcrProcessedPages(new Set())
      setVersionsOpen(false)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't restore this version.")
    }
  }

  async function handleDeleteVersion(versionId: number) {
    setError(null)
    try {
      await api.delete(`/versions/${versionId}`)
      setVersions((prev) => prev.filter((v) => v.id !== versionId))
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't delete this version.")
    }
  }

  async function handleDownloadVersion(versionId: number, label: string, versionNumber: number) {
    const { data } = await api.get(`/versions/${versionId}/download`, { responseType: "arraybuffer" })
    const blob = new Blob([data], { type: "application/pdf" })
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objUrl
    a.download = `${source.replace(/\.[^/.]+$/, "")}_v${versionNumber}${label ? "_" + label.replace(/[^a-z0-9]+/gi, "_") : ""}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objUrl)
  }

  const textItems = currentEntry?.type === "page" ? pageTextItems[currentEntry.origIndex] || [] : []
  const currentAddedTexts = currentEntry ? addedTexts.filter((a) => a.pageEntryId === currentEntry.id) : []
  const currentAddedSignatures = currentEntry ? addedSignatures.filter((s) => s.pageEntryId === currentEntry.id) : []

  const changeCount =
    Object.keys(edits).filter((k) => {
      const [origIdx, i] = k.split("-").map(Number)
      const item = (pageTextItems[origIdx] || [])[i]
      return item && edits[k] !== item.originalText
    }).length +
    addedTexts.filter((a) => a.text.trim()).length +
    addedSignatures.length

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">{t("common.uploadFirst")}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("editorPanel.title")}</h2>
      <p className="text-xs text-text-muted">
        {t("editorPanel.description")}
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
          {addingText ? (
            t("editorPanel.clickPlaceText")
          ) : (
            <>
              <Icon name="add" size={17} />
              {t("editorPanel.addText")}
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleAutoRedactPII} disabled={loading || !pdfDoc || redacting} title={t("editorPanel.autoRedactTooltip")}>
          {redacting ? (
            t("editorPanel.scanning")
          ) : (
            <>
              <Icon name="visibility_off" size={17} />
              {t("editorPanel.redactPii")}
            </>
          )}
        </Button>
        <Button
          variant={placingSignature ? "default" : "outline"}
          onClick={() => {
            if (placingSignature) {
              setPlacingSignature(null)
            } else {
              setSigTab("draw")
              setTypedSigText("")
              setSigModalOpen(true)
            }
          }}
          disabled={loading || !pdfDoc}
        >
          {placingSignature ? (
            t("editorPanel.clickPlaceSignature")
          ) : (
            <>
              <Icon name="draw" size={17} />
              {t("editorPanel.addSignature")}
            </>
          )}
        </Button>
        <Button onClick={handleExport} disabled={exporting || !pdfDoc || changeCount === 0}>
          {exporting ? (
            t("editorPanel.exporting")
          ) : (
            <>
              <Icon name="download" size={17} />
              {t("editorPanel.download")} ({changeCount})
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleSaveVersion} disabled={savingVersion || !pdfDoc || changeCount === 0}>
          {savingVersion ? (
            t("editorPanel.savingVersion")
          ) : (
            <>
              <Icon name="save" size={17} />
              {t("editorPanel.saveVersion")}
            </>
          )}
        </Button>
        <Button variant="outline" onClick={openVersions} disabled={!pdfDoc}>
          <Icon name="history" size={17} />
          {t("editorPanel.versions")}
        </Button>
      </div>

      {/* Style toolbar — applies to new text added and to the item currently being edited */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs text-text-muted">
        <span className="font-semibold text-text">{t("editorPanel.styleLabel")}</span>
        <label className="flex items-center gap-1">
          {t("editorPanel.size")}
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
          {t("editorPanel.bold")}
        </label>
        <label className="flex items-center gap-1">
          {t("editorPanel.color")}
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
      {loading && <LoadingState label={t("editorPanel.loadingDocument")} />}

      {pdfDoc && currentEntry && (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" disabled={currentPos === 0} onClick={() => movePosition(-1)}>
              {t("editorPanel.prev")}
            </Button>
            <span className="text-sm text-text-muted">
              {t("editorPanel.page")} {currentPos + 1} / {pageOrder.length}
              {currentEntry.type === "blank" && ` ${t("editorPanel.blank")}`}
            </span>
            <Button variant="outline" disabled={currentPos >= pageOrder.length - 1} onClick={() => movePosition(1)}>
              {t("editorPanel.next")}
            </Button>

            <span className="mx-1 h-4 w-px bg-border" />

            <Button variant="outline" disabled={currentPos === 0} onClick={() => reorderPage(-1)} title={t("editorPanel.moveUpTooltip")}>
              {t("editorPanel.moveUp")}
            </Button>
            <Button
              variant="outline"
              disabled={currentPos >= pageOrder.length - 1}
              onClick={() => reorderPage(1)}
              title={t("editorPanel.moveDownTooltip")}
            >
              {t("editorPanel.moveDown")}
            </Button>
            <Button variant="outline" onClick={insertBlankPage}>
              {t("editorPanel.blankPage")}
            </Button>
            <Button variant="destructive" onClick={deleteCurrentPage}>
              {t("editorPanel.deletePage")}
            </Button>

            {currentEntry.type === "page" &&
              pageSizes[currentEntry.origIndex] &&
              (pageTextItems[currentEntry.origIndex] || []).length === 0 &&
              !ocrProcessedPages.has(currentEntry.origIndex) && (
                <>
                  <span className="mx-1 h-4 w-px bg-border" />
                  <Button
                    variant="outline"
                    onClick={() => handleOcrPage(currentEntry.origIndex)}
                    disabled={ocrBusy}
                    title={t("editorPanel.ocrTooltip")}
                  >
                    {ocrBusy ? t("editorPanel.scanningPage") : t("editorPanel.ocrThisPage")}
                  </Button>
                </>
              )}
          </div>

          <div className="overflow-auto rounded-2xl border border-white/10 bg-white/3 p-4">
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              className="relative mx-auto w-fit"
              style={{ cursor: addingText || placingSignature ? "crosshair" : "default" }}
            >
              <canvas ref={canvasRef} className="block" />

              {currentAddedSignatures.map((sig) => (
                <div key={sig.id} style={{ position: "absolute", left: sig.left, top: sig.top }}>
                  <img
                    src={sig.dataUrl}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSigId(sig.id === selectedSigId ? null : sig.id)
                    }}
                    style={{
                      width: sig.widthPx,
                      height: sig.heightPx,
                      cursor: "pointer",
                      outline: selectedSigId === sig.id ? "1px dashed #10b981" : "none",
                    }}
                  />
                  {selectedSigId === sig.id && (
                    <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          resizeSignature(sig.id, 0.85)
                        }}
                        style={{ fontSize: 11, background: "#334155", color: "white", border: "none", borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}
                      >
                        −
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          resizeSignature(sig.id, 1.15)
                        }}
                        style={{ fontSize: 11, background: "#334155", color: "white", border: "none", borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}
                      >
                        +
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSignature(sig.id)
                        }}
                        style={{ display: "flex", background: "#ef4444", color: "white", border: "none", borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}
                      >
                        <Icon name="delete" size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

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
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => deleteExistingText(item.key)}
                      title={t("editorPanel.deleteThisText")}
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
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: item.height + 2,
                        display: "flex",
                        gap: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {REWRITE_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleAiRewrite(item.key, action.instruction, false)}
                          disabled={aiBusyKey === item.key}
                          title={action.instruction}
                          style={{
                            fontSize: 10,
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            padding: "1px 5px",
                            cursor: aiBusyKey === item.key ? "wait" : "pointer",
                            opacity: aiBusyKey === item.key ? 0.6 : 1,
                          }}
                        >
                          {aiBusyKey === item.key ? "…" : action.label}
                        </button>
                      ))}
                    </div>
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
                    title={isDeleted ? t("editorPanel.deletedTitle") : item.originalText}
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
                  <div key={a.id} style={{ position: "absolute", left: a.left, top: a.top - a.style.fontSize }}>
                    <input
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
                        width: 180,
                        fontSize: a.style.fontSize,
                        fontWeight: a.style.bold ? 700 : 400,
                        color: a.style.color,
                        border: "1px solid #10b981",
                        background: "white",
                      }}
                    />
                    <div style={{ display: "flex", gap: 2, marginTop: 2, whiteSpace: "nowrap" }}>
                      {REWRITE_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleAiRewrite(a.id, action.instruction, true)}
                          disabled={aiBusyKey === a.id}
                          title={action.instruction}
                          style={{
                            fontSize: 10,
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            padding: "1px 5px",
                            cursor: aiBusyKey === a.id ? "wait" : "pointer",
                            opacity: aiBusyKey === a.id ? 0.6 : 1,
                          }}
                        >
                          {aiBusyKey === a.id ? "…" : action.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                    {a.text || t("editorPanel.clickToType")}
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}

      {sigModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSigModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-base font-semibold text-text">{t("editorPanel.addSignatureModalTitle")}</h3>
            <div className="mb-3 flex gap-2">
              <Button variant={sigTab === "draw" ? "default" : "outline"} onClick={() => setSigTab("draw")}>
                {t("editorPanel.draw")}
              </Button>
              <Button variant={sigTab === "type" ? "default" : "outline"} onClick={() => setSigTab("type")}>
                {t("editorPanel.type")}
              </Button>
            </div>

            {sigTab === "draw" ? (
              <>
                <canvas
                  ref={sigCanvasRef}
                  width={SIG_CANVAS_WIDTH}
                  height={SIG_CANVAS_HEIGHT}
                  onMouseDown={startDrawing}
                  onMouseMove={drawStroke}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full cursor-crosshair rounded-lg border border-border bg-white"
                  style={{ touchAction: "none" }}
                />
                <div className="mt-3 flex justify-between gap-2">
                  <Button variant="outline" onClick={clearSigCanvas}>
                    {t("editorPanel.clear")}
                  </Button>
                  <Button onClick={confirmDrawnSignature}>{t("editorPanel.useThisSignature")}</Button>
                </div>
              </>
            ) : (
              <>
                <input
                  autoFocus
                  value={typedSigText}
                  onChange={(e) => setTypedSigText(e.target.value)}
                  placeholder={t("editorPanel.typeYourName")}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-text"
                />
                <div
                  className="mt-3 flex h-20 items-center justify-center rounded-lg border border-border bg-white px-3"
                  style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive", fontSize: 28, color: "black" }}
                >
                  {typedSigText || t("editorPanel.preview")}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button onClick={confirmTypedSignature} disabled={!typedSigText.trim()}>
                    {t("editorPanel.useThisSignature")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {versionsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setVersionsOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-base font-semibold text-text">{t("editorPanel.versions")}</h3>

            <div className="mb-3 flex gap-2">
              <input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder={t("editorPanel.versionLabelPlaceholder")}
                className="flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-text"
              />
              <Button onClick={handleSaveVersion} disabled={savingVersion || changeCount === 0}>
                {savingVersion ? (
                  t("editorPanel.savingVersion")
                ) : (
                  <>
                    <Icon name="save" size={17} />
                    {t("editorPanel.saveVersion")}
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {versionsLoading && <LoadingState label={t("editorPanel.loadingVersions")} />}
              {!versionsLoading && versions.length === 0 && (
                <p className="text-sm text-text-muted">{t("editorPanel.noVersions")}</p>
              )}
              <div className="flex flex-col gap-2">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        v{v.version_number} {v.label && `— ${v.label}`}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(v.created_at).toLocaleString()} · {(v.size_bytes / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => handleRestoreVersion(v.id)}
                        title={t("editorPanel.restore")}
                        className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-xs text-accent"
                      >
                        {t("editorPanel.restore")}
                      </button>
                      <button
                        onClick={() => handleDownloadVersion(v.id, v.label, v.version_number)}
                        title={t("common.download")}
                        className="rounded-md border border-border px-2 py-1 text-text-muted"
                      >
                        <Icon name="download" size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteVersion(v.id)}
                        title={t("editorPanel.deleteThisText")}
                        className="rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-danger"
                      >
                        <Icon name="delete" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
