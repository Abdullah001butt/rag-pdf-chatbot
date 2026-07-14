import * as React from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } from "pdf-lib"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"
import { Icon } from "@/components/ui/icon"

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface PdfFormFillerPanelProps {
  files: string[]
}

type FieldType = "text" | "checkbox" | "dropdown" | "radio"

interface FieldInfo {
  name: string
  type: FieldType
  options?: string[]
}

interface DesignField {
  id: string
  pageIndex: number
  left: number
  top: number
  pdfX: number
  pdfYTop: number
  widthPdf: number
  heightPdf: number
  widthPx: number
  heightPx: number
  type: "text" | "checkbox"
  name: string
}

const TEXT_FIELD_PX = { width: 150, height: 24 }
const CHECKBOX_FIELD_PX = { width: 18, height: 18 }

export function PdfFormFillerPanel({ files }: PdfFormFillerPanelProps) {
  const { t } = useLanguage()
  const [source, setSource] = React.useState(files[0] || "")
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null)
  const [mode, setMode] = React.useState<"fill" | "design">("fill")

  // Fill-existing-fields mode
  const [fields, setFields] = React.useState<FieldInfo[]>([])
  const [values, setValues] = React.useState<Record<string, string | boolean>>({})

  // Design-new-fields mode
  const [pdfDoc, setPdfDoc] = React.useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(0)
  const [designFields, setDesignFields] = React.useState<DesignField[]>([])
  const [addingFieldType, setAddingFieldType] = React.useState<"text" | "checkbox" | null>(null)
  const scale = 1.4

  const [loading, setLoading] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!source && files.length > 0) setSource(files[0])
  }, [files, source])

  React.useEffect(() => {
    if (source) loadDocument(source)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  async function loadDocument(filename: string) {
    setLoading(true)
    setError(null)
    setFields([])
    setValues({})
    setDesignFields([])
    setCurrentPage(0)
    try {
      const { data } = await api.get("/documents/raw", {
        params: { filename },
        responseType: "arraybuffer",
      })
      setPdfBytes(data)

      const doc = await PDFDocument.load(data.slice(0))
      const form = doc.getForm()
      const initialValues: Record<string, string | boolean> = {}
      const infos: FieldInfo[] = []

      for (const field of form.getFields()) {
        const name = field.getName()
        if (field instanceof PDFTextField) {
          infos.push({ name, type: "text" })
          initialValues[name] = field.getText() || ""
        } else if (field instanceof PDFCheckBox) {
          infos.push({ name, type: "checkbox" })
          initialValues[name] = field.isChecked()
        } else if (field instanceof PDFDropdown) {
          const options = field.getOptions()
          infos.push({ name, type: "dropdown", options })
          initialValues[name] = field.getSelected()[0] || options[0] || ""
        } else if (field instanceof PDFRadioGroup) {
          const options = field.getOptions()
          infos.push({ name, type: "radio", options })
          initialValues[name] = field.getSelected() || ""
        } else if (field instanceof PDFOptionList) {
          const options = field.getOptions()
          infos.push({ name, type: "dropdown", options })
          initialValues[name] = field.getSelected()[0] || options[0] || ""
        }
      }

      setFields(infos)
      setValues(initialValues)

      const jsDoc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
      setPdfDoc(jsDoc)
      setNumPages(jsDoc.numPages)
    } catch (err: any) {
      setError(err?.response?.data?.detail || t("editorPanel.errLoadDocument"))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (mode !== "design" || !pdfDoc) return
    renderPage(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pdfDoc, currentPage])

  async function renderPage(pageIndex: number) {
    if (!pdfDoc || !canvasRef.current) return
    const page = await pdfDoc.getPage(pageIndex + 1)
    const viewport = page.getViewport({ scale })
    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")!
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!addingFieldType || !containerRef.current || !canvasRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const left = e.clientX - rect.left
    const top = e.clientY - rect.top
    const sizePx = addingFieldType === "text" ? TEXT_FIELD_PX : CHECKBOX_FIELD_PX
    const pdfX = left / scale
    const pdfYTop = (canvasRef.current.height - top) / scale
    const count = designFields.length + 1
    const id = `df-${Date.now()}`
    setDesignFields((prev) => [
      ...prev,
      {
        id,
        pageIndex: currentPage,
        left,
        top,
        pdfX,
        pdfYTop,
        widthPdf: sizePx.width / scale,
        heightPdf: sizePx.height / scale,
        widthPx: sizePx.width,
        heightPx: sizePx.height,
        type: addingFieldType,
        name: addingFieldType === "text" ? `field_${count}` : `checkbox_${count}`,
      },
    ])
    setAddingFieldType(null)
  }

  function renameDesignField(id: string, name: string) {
    setDesignFields((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
  }

  function deleteDesignField(id: string) {
    setDesignFields((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleExportFilled() {
    if (!pdfBytes) return
    setExporting(true)
    setError(null)
    try {
      const doc = await PDFDocument.load(pdfBytes)
      const form = doc.getForm()

      fields.forEach((f) => {
        const val = values[f.name]
        try {
          if (f.type === "text") {
            form.getTextField(f.name).setText(String(val ?? ""))
          } else if (f.type === "checkbox") {
            const cb = form.getCheckBox(f.name)
            if (val) cb.check()
            else cb.uncheck()
          } else if (f.type === "dropdown") {
            const dropdown = form.getFields().find((x) => x.getName() === f.name)
            if (dropdown instanceof PDFDropdown || dropdown instanceof PDFOptionList) {
              dropdown.select(String(val))
            }
          } else if (f.type === "radio") {
            if (val) form.getRadioGroup(f.name).select(String(val))
          }
        } catch {
          // Skip fields that fail to set (e.g. malformed widget) rather than aborting the export.
        }
      })

      form.flatten()
      downloadDoc(await doc.save(), "_filled.pdf")
    } catch (err: any) {
      setError(`${t("editorPanel.errExportFailed")} ` + (err?.message || "unknown error"))
    } finally {
      setExporting(false)
    }
  }

  async function handleExportFillable() {
    if (!pdfBytes || designFields.length === 0) return
    setExporting(true)
    setError(null)
    try {
      const doc = await PDFDocument.load(pdfBytes)
      const form = doc.getForm()
      const pages = doc.getPages()
      const usedNames = new Set<string>()

      designFields.forEach((f) => {
        const page = pages[f.pageIndex]
        if (!page) return
        let name = f.name.trim() || (f.type === "text" ? "field" : "checkbox")
        while (usedNames.has(name)) name = `${name}_2`
        usedNames.add(name)

        const rect = { x: f.pdfX, y: f.pdfYTop - f.heightPdf, width: f.widthPdf, height: f.heightPdf, borderWidth: 1 }
        if (f.type === "text") {
          form.createTextField(name).addToPage(page, rect)
        } else {
          form.createCheckBox(name).addToPage(page, rect)
        }
      })

      downloadDoc(await doc.save(), "_fillable.pdf")
    } catch (err: any) {
      setError(`${t("editorPanel.errExportFailed")} ` + (err?.message || "unknown error"))
    } finally {
      setExporting(false)
    }
  }

  function downloadDoc(bytes: Uint8Array, suffix: string) {
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${source.replace(/\.[^/.]+$/, "")}${suffix}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">{t("common.uploadFirst")}</p>
  }

  const currentDesignFields = designFields.filter((f) => f.pageIndex === currentPage)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("formFillerPanel.title")}</h2>

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
        <Button variant={mode === "fill" ? "default" : "outline"} onClick={() => setMode("fill")}>
          {t("formFillerPanel.fillMode")}
        </Button>
        <Button variant={mode === "design" ? "default" : "outline"} onClick={() => setMode("design")}>
          {t("formFillerPanel.designMode")}
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <LoadingState label={t("editorPanel.loadingDocument")} />}

      {mode === "fill" && !loading && (
        <>
          <p className="text-xs text-text-muted">{t("formFillerPanel.fillDescription")}</p>
          <div>
            <Button onClick={handleExportFilled} disabled={exporting || fields.length === 0}>
              {exporting ? t("editorPanel.exporting") : `⬇ ${t("formFillerPanel.downloadFilled")}`}
            </Button>
          </div>
          {!error && fields.length === 0 && (
            <p className="text-sm text-text-muted">{t("formFillerPanel.noFieldsMessage")}</p>
          )}
          {fields.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/3 p-4">
              {fields.map((f) => (
                <label key={f.name} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-text">{f.name}</span>
                  {f.type === "text" && (
                    <input
                      type="text"
                      value={(values[f.name] as string) || ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
                    />
                  )}
                  {f.type === "checkbox" && (
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.name])}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.checked }))}
                      className="h-4 w-4"
                    />
                  )}
                  {(f.type === "dropdown" || f.type === "radio") && (
                    <select
                      value={(values[f.name] as string) || ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
                    >
                      {(f.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "design" && !loading && pdfDoc && (
        <>
          <p className="text-xs text-text-muted">{t("formFillerPanel.designDescription")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={addingFieldType === "text" ? "default" : "outline"} onClick={() => setAddingFieldType(addingFieldType === "text" ? null : "text")}>
              {addingFieldType === "text" ? t("formFillerPanel.clickToPlace") : t("formFillerPanel.textField")}
            </Button>
            <Button variant={addingFieldType === "checkbox" ? "default" : "outline"} onClick={() => setAddingFieldType(addingFieldType === "checkbox" ? null : "checkbox")}>
              {addingFieldType === "checkbox" ? t("formFillerPanel.clickToPlace") : t("formFillerPanel.checkbox")}
            </Button>
            <Button onClick={handleExportFillable} disabled={exporting || designFields.length === 0}>
              {exporting ? t("editorPanel.exporting") : `⬇ ${t("formFillerPanel.downloadFillable")} (${designFields.length})`}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
              {t("editorPanel.prev")}
            </Button>
            <span className="text-sm text-text-muted">
              {t("editorPanel.page")} {currentPage + 1} / {numPages}
            </span>
            <Button variant="outline" disabled={currentPage >= numPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
              {t("editorPanel.next")}
            </Button>
          </div>

          <div className="overflow-auto rounded-2xl border border-white/10 bg-white/3 p-4">
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              className="relative mx-auto w-fit"
              style={{ cursor: addingFieldType ? "crosshair" : "default" }}
            >
              <canvas ref={canvasRef} className="block" />
              {currentDesignFields.map((f) => (
                <div
                  key={f.id}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: f.left,
                    top: f.top,
                    width: f.widthPx,
                    height: f.heightPx,
                    background: "rgba(16,185,129,0.15)",
                    border: "1px dashed #10b981",
                  }}
                >
                  <input
                    value={f.name}
                    onChange={(e) => renameDesignField(f.id, e.target.value)}
                    style={{
                      position: "absolute",
                      top: -20,
                      left: 0,
                      width: Math.max(f.widthPx, 80),
                      fontSize: 10,
                      padding: "1px 3px",
                      border: "1px solid #10b981",
                      background: "white",
                      color: "black",
                    }}
                  />
                  <button
                    onClick={() => deleteDesignField(f.id)}
                    style={{
                      position: "absolute",
                      right: -20,
                      top: 0,
                      display: "flex",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      padding: "1px 4px",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="delete" size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
