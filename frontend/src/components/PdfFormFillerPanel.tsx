import * as React from "react"
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } from "pdf-lib"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"

interface PdfFormFillerPanelProps {
  files: string[]
}

type FieldType = "text" | "checkbox" | "dropdown" | "radio"

interface FieldInfo {
  name: string
  type: FieldType
  options?: string[]
}

export function PdfFormFillerPanel({ files }: PdfFormFillerPanelProps) {
  const [source, setSource] = React.useState(files[0] || "")
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null)
  const [fields, setFields] = React.useState<FieldInfo[]>([])
  const [values, setValues] = React.useState<Record<string, string | boolean>>({})
  const [loading, setLoading] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't load the document.")
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
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
      const editedBytes = await doc.save()
      const blob = new Blob([editedBytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${source.replace(/\.[^/.]+$/, "")}_filled.pdf`
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

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">Upload at least one PDF in the sidebar first.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Form Filler</h2>
      <p className="text-xs text-text-muted">
        Fill in this PDF's existing form fields, then export a flattened copy with your values baked in as static
        content. Only works on PDFs that already contain fillable AcroForm fields.
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
        <Button onClick={handleExport} disabled={exporting || loading || fields.length === 0}>
          {exporting ? "Exporting..." : "⬇ Download Filled PDF"}
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <LoadingState label="Loading document..." />}

      {!loading && !error && fields.length === 0 && (
        <p className="text-sm text-text-muted">This PDF has no fillable form fields.</p>
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
    </div>
  )
}
