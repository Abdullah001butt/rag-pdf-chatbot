import * as React from "react"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/Spinner"

interface Rule {
  id: number
  name: string
  match_keyword: string
  actions: string[]
  deliver_email: boolean
  enabled: boolean
  created_at: string
}

interface Run {
  id: number
  rule_id: number
  rule_name: string
  filename: string
  status: "success" | "error" | "skipped"
  result_text: string
  error_message: string
  created_at: string
}

const ACTION_OPTIONS = [
  { key: "summary", labelKey: "dash.tab.summary" },
  { key: "notes", labelKey: "dash.tab.notes" },
  { key: "quiz", labelKey: "dash.tab.quiz" },
  { key: "flashcards", labelKey: "dash.tab.flashcards" },
]

export function AutomationsPanel() {
  const { t } = useLanguage()
  const [rules, setRules] = React.useState<Rule[]>([])
  const [runs, setRuns] = React.useState<Run[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [expandedRun, setExpandedRun] = React.useState<number | null>(null)

  const [name, setName] = React.useState("")
  const [keyword, setKeyword] = React.useState("")
  const [selectedActions, setSelectedActions] = React.useState<Set<string>>(new Set(["summary"]))
  const [deliverEmail, setDeliverEmail] = React.useState(true)
  const [creating, setCreating] = React.useState(false)

  React.useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [rulesRes, runsRes] = await Promise.all([api.get("/automations"), api.get("/automations/runs")])
      setRules(rulesRes.data.rules || [])
      setRuns(runsRes.data.runs || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't load automations.")
    } finally {
      setLoading(false)
    }
  }

  function toggleAction(key: string) {
    setSelectedActions((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleCreate() {
    if (!name.trim() || selectedActions.size === 0) return
    setCreating(true)
    setError(null)
    try {
      const { data } = await api.post("/automations", {
        name: name.trim(),
        match_keyword: keyword.trim(),
        actions: Array.from(selectedActions),
        deliver_email: deliverEmail,
      })
      setRules((prev) => [data, ...prev])
      setName("")
      setKeyword("")
      setSelectedActions(new Set(["summary"]))
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't create the automation.")
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(rule: Rule) {
    const nextEnabled = !rule.enabled
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: nextEnabled } : r)))
    try {
      await api.patch(`/automations/${rule.id}/toggle`, null, { params: { enabled: nextEnabled } })
    } catch {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r)))
    }
  }

  async function handleDelete(ruleId: number) {
    try {
      await api.delete(`/automations/${ruleId}`)
      setRules((prev) => prev.filter((r) => r.id !== ruleId))
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't delete the automation.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text">{t("automations.title")}</h2>
        <p className="text-xs text-text-muted">{t("automations.description")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/3 p-4">
        <h3 className="text-sm font-semibold text-text">{t("automations.createTitle")}</h3>
        <Input placeholder={t("automations.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder={t("automations.keywordPlaceholder")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          {ACTION_OPTIONS.map((a) => (
            <label key={a.key} className="flex items-center gap-1.5 text-sm text-text">
              <input type="checkbox" checked={selectedActions.has(a.key)} onChange={() => toggleAction(a.key)} />
              {t(a.labelKey)}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-sm text-text">
          <input type="checkbox" checked={deliverEmail} onChange={(e) => setDeliverEmail(e.target.checked)} />
          {t("automations.emailMe")}
        </label>
        <div>
          <Button onClick={handleCreate} disabled={creating || !name.trim() || selectedActions.size === 0}>
            {creating ? t("common.generating") : `⚡ ${t("automations.create")}`}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <LoadingState label={t("common.generating")} />}

      {!loading && (
        <>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">{t("automations.yourAutomations")}</h3>
            {rules.length === 0 && <p className="text-sm text-text-muted">{t("automations.noRules")}</p>}
            <div className="flex flex-col gap-2">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{r.name}</p>
                    <p className="text-xs text-text-muted">
                      {r.match_keyword ? `"${r.match_keyword}" · ` : ""}
                      {r.actions.map((a) => t(ACTION_OPTIONS.find((o) => o.key === a)?.labelKey || a)).join(", ")}
                      {r.deliver_email ? ` · ✉️` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleToggle(r)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${r.enabled ? "bg-accent/15 text-accent" : "bg-white/5 text-text-muted"}`}
                    >
                      {r.enabled ? t("automations.enabled") : t("automations.disabled")}
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-xs text-danger">
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">{t("automations.runHistory")}</h3>
            {runs.length === 0 && <p className="text-sm text-text-muted">{t("automations.noRuns")}</p>}
            <div className="flex flex-col gap-2">
              {runs.map((run) => (
                <div key={run.id} className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
                  <button
                    className="flex w-full items-center justify-between gap-2 text-left"
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {run.rule_name} — {run.filename}
                      </p>
                      <p className="text-xs text-text-muted">{new Date(run.created_at).toLocaleString()}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        run.status === "success"
                          ? "bg-success/10 text-success"
                          : run.status === "error"
                          ? "bg-danger/10 text-danger"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {run.status === "success" ? t("automations.statusSuccess") : run.status === "error" ? t("automations.statusError") : t("automations.statusSkipped")}
                    </span>
                  </button>
                  {expandedRun === run.id && (
                    <div className="mt-2 whitespace-pre-wrap border-t border-white/10 pt-2 text-xs text-text-muted">
                      {run.status === "success" ? run.result_text : run.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
