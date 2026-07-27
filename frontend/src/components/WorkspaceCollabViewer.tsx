import * as React from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { api, getAccessToken } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"
import { LoadingState } from "@/components/Spinner"

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface WorkspaceCollabViewerProps {
  workspaceId: number
  documentId: number
  filename: string
  onClose: () => void
}

interface PresenceUser {
  user_id: number
  username: string
  color: string
}

interface CursorState extends PresenceUser {
  x: number
  y: number
  page: number
}

function wsUrl(path: string) {
  const base: string = api.defaults.baseURL || ""
  const wsBase = base.replace(/^http/, "ws")
  return `${wsBase}${path}`
}

export function WorkspaceCollabViewer({ workspaceId, documentId, filename, onClose }: WorkspaceCollabViewerProps) {
  const { t } = useLanguage()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const wsRef = React.useRef<WebSocket | null>(null)
  const lastSentRef = React.useRef(0)

  const [pdfDoc, setPdfDoc] = React.useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [presence, setPresence] = React.useState<Map<number, PresenceUser>>(new Map())
  const [cursors, setCursors] = React.useState<Map<number, CursorState>>(new Map())

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get(`/workspaces/${workspaceId}/documents/${documentId}/download`, { responseType: "arraybuffer" })
      .then(async ({ data }) => {
        if (cancelled) return
        const doc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
        if (cancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this document.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, documentId])

  React.useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let cancelled = false
    pdfDoc.getPage(page).then(async (pdfPage) => {
      if (cancelled || !canvasRef.current) return
      const viewport = pdfPage.getViewport({ scale: 1.3 })
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")!
      await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise
    })
    return () => {
      cancelled = true
    }
  }, [pdfDoc, page])

  React.useEffect(() => {
    const token = getAccessToken()
    if (!token) return
    const ws = new WebSocket(wsUrl(`/ws/workspaces/${workspaceId}?token=${encodeURIComponent(token)}`))
    wsRef.current = ws

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      if (msg.type === "presence") {
        const next = new Map<number, PresenceUser>()
        for (const u of msg.users) next.set(u.user_id, u)
        setPresence(next)
      } else if (msg.type === "join") {
        setPresence((prev) => new Map(prev).set(msg.user_id, msg))
      } else if (msg.type === "leave") {
        setPresence((prev) => {
          const next = new Map(prev)
          next.delete(msg.user_id)
          return next
        })
        setCursors((prev) => {
          const next = new Map(prev)
          next.delete(msg.user_id)
          return next
        })
      } else if (msg.type === "cursor" && msg.filename === filename) {
        setCursors((prev) => new Map(prev).set(msg.user_id, msg))
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, filename])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !containerRef.current) return
    const now = Date.now()
    if (now - lastSentRef.current < 60) return
    lastSentRef.current = now
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    ws.send(JSON.stringify({ type: "cursor", x, y, page, filename }))
  }

  const cursorsOnPage = Array.from(cursors.values()).filter((c) => c.page === page)

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
          <Icon name="picture_as_pdf" size={15} className="shrink-0 text-danger/80" />
          <span className="truncate">{filename}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex -space-x-1.5">
            {Array.from(presence.values())
              .slice(0, 5)
              .map((u) => (
                <span
                  key={u.user_id}
                  title={u.username}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white"
                  style={{ background: u.color }}
                >
                  {u.username.slice(0, 1).toUpperCase()}
                </span>
              ))}
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-text-muted hover:bg-white/10 hover:text-text">
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      <div className="scrollbar-thin relative flex-1 overflow-auto p-3" ref={containerRef} onMouseMove={handleMouseMove}>
        {loading && <LoadingState label={t("common.generating")} />}
        {error && <p className="text-sm text-danger">{error}</p>}
        {!loading && !error && (
          <div className="relative mx-auto w-fit">
            <canvas ref={canvasRef} className="block rounded-lg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
            {cursorsOnPage.map((c) => (
              <div
                key={c.user_id}
                className="pointer-events-none absolute z-10 -translate-x-0.5 -translate-y-0.5 transition-[left,top] duration-100"
                style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
              >
                <span style={{ color: c.color }}>
                  <Icon name="near_me" size={18} filled />
                </span>
                <span
                  className="ml-3 -mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow"
                  style={{ background: c.color }}
                >
                  {c.username}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {numPages > 0 && (
        <div className="flex items-center justify-center gap-3 border-t border-border px-3 py-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-border px-2 py-1 text-text-muted disabled:opacity-30"
          >
            <Icon name="chevron_left" size={16} />
          </button>
          <span className="text-xs text-text-muted">
            {page} / {numPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            className="rounded-md border border-border px-2 py-1 text-text-muted disabled:opacity-30"
          >
            <Icon name="chevron_right" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
