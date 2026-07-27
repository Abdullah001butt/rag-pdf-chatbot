import * as React from "react"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { CardListSkeleton } from "@/components/ui/skeleton"

interface GraphNode {
  id: string
  label: string
  type: string
  x: number
  y: number
  vx: number
  vy: number
}

interface GraphEdge {
  source: string
  target: string
  label: string
}

interface KnowledgeGraphPanelProps {
  files: string[]
}

const TYPE_COLORS: Record<string, string> = {
  person: "#f59e0b",
  org: "#3b82f6",
  concept: "#10b981",
  term: "#a78bfa",
  date: "#f87171",
  other: "#9aa3b8",
}

const WIDTH = 900
const HEIGHT = 560

function simulate(nodes: GraphNode[], edges: GraphEdge[], iterations: number) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let distSq = dx * dx + dy * dy || 0.01
        const dist = Math.sqrt(distSq)
        const force = 2200 / distSq
        dx /= dist
        dy /= dist
        a.vx += dx * force
        a.vy += dy * force
        b.vx -= dx * force
        b.vy -= dy * force
      }
    }
    // Spring attraction along edges
    for (const e of edges) {
      const a = byId.get(e.source)
      const b = byId.get(e.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const force = (dist - 160) * 0.02
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }
    // Pull toward center + integrate + damping
    for (const n of nodes) {
      n.vx += (WIDTH / 2 - n.x) * 0.002
      n.vy += (HEIGHT / 2 - n.y) * 0.002
      n.vx *= 0.85
      n.vy *= 0.85
      n.x += n.vx
      n.y += n.vy
      n.x = Math.max(40, Math.min(WIDTH - 40, n.x))
      n.y = Math.max(40, Math.min(HEIGHT - 40, n.y))
    }
  }
}

export function KnowledgeGraphPanel({ files }: KnowledgeGraphPanelProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [source, setSource] = React.useState(files[0] || "")
  const [loading, setLoading] = React.useState(false)
  const [nodes, setNodes] = React.useState<GraphNode[]>([])
  const [edges, setEdges] = React.useState<GraphEdge[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!source && files.length > 0) setSource(files[0])
  }, [files, source])

  async function handleGenerate() {
    if (!source) return
    setLoading(true)
    setNodes([])
    setEdges([])
    setSelectedId(null)
    try {
      const { data } = await api.post("/generate/knowledge-graph", { source })
      const rawNodes = (data.nodes || []) as { id: string; label: string; type: string }[]
      const rawEdges = (data.edges || []) as GraphEdge[]
      const validIds = new Set(rawNodes.map((n) => n.id))

      const laidOut: GraphNode[] = rawNodes.map((n, i) => {
        const angle = (i / rawNodes.length) * Math.PI * 2
        const radius = 180
        return {
          ...n,
          x: WIDTH / 2 + Math.cos(angle) * radius,
          y: HEIGHT / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        }
      })
      const cleanEdges = rawEdges.filter((e) => validIds.has(e.source) && validIds.has(e.target))
      simulate(laidOut, cleanEdges, 220)

      setNodes(laidOut)
      setEdges(cleanEdges)
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't generate the knowledge graph.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">{t("common.uploadFirst")}</p>
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const connectedIds = selectedId
    ? new Set(
        edges
          .filter((e) => e.source === selectedId || e.target === selectedId)
          .flatMap((e) => [e.source, e.target])
      )
    : null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("graph.title")}</h2>
      <p className="text-xs text-text-muted">{t("graph.description")}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
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
        <Button onClick={handleGenerate} disabled={loading} className="shrink-0">
          <Icon name="hub" size={17} />
          {loading ? t("graph.generating") : t("graph.generate")}
        </Button>
      </div>

      {loading && <CardListSkeleton count={3} />}

      {!loading && nodes.length > 0 && (
        <div className="card-surface scrollbar-thin overflow-auto rounded-2xl p-2">
          <svg width={WIDTH} height={HEIGHT} className="block">
            <g>
              {edges.map((e, i) => {
                const a = byId.get(e.source)
                const b = byId.get(e.target)
                if (!a || !b) return null
                const dimmed = connectedIds && !(connectedIds.has(e.source) && connectedIds.has(e.target))
                return (
                  <g key={i} opacity={dimmed ? 0.15 : 1}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.25)" strokeWidth={1.2} />
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2}
                      fill="rgba(255,255,255,0.4)"
                      fontSize={10}
                      textAnchor="middle"
                    >
                      {e.label}
                    </text>
                  </g>
                )
              })}
            </g>
            <g>
              {nodes.map((n) => {
                const dimmed = connectedIds && n.id !== selectedId && !connectedIds.has(n.id)
                const color = TYPE_COLORS[n.type] || TYPE_COLORS.other
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    opacity={dimmed ? 0.25 : 1}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(selectedId === n.id ? null : n.id)}
                  >
                    <circle r={n.id === selectedId ? 24 : 18} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
                    <text textAnchor="middle" dy={4} fontSize={11} fontWeight={600} fill="#e7eaf2">
                      {n.label.length > 14 ? n.label.slice(0, 13) + "…" : n.label}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      )}

      {!loading && nodes.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {t(`graph.type.${type}`)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
