import * as React from "react"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { useToast } from "@/context/ToastContext"
import { Icon } from "@/components/ui/icon"
import { Skeleton } from "@/components/ui/skeleton"

interface DailyPoint {
  date: string
  count: number
}

interface ActionBreakdown {
  action: string
  label: string
  count: number
}

interface Summary {
  tier: string
  daily_limit: number | null
  used_today: number
  total_period: number
  days: number
  daily: DailyPoint[]
  by_action: ActionBreakdown[]
  busiest_day: DailyPoint | null
}

const RANGE_OPTIONS = [7, 30, 90]

const ACTION_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#059669", "#047857", "#065f46", "#a7f3d0"]

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function AnalyticsPanel() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [days, setDays] = React.useState(30)
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)

  React.useEffect(() => {
    loadSummary(days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  async function loadSummary(range: number) {
    setLoading(true)
    try {
      const { data } = await api.get("/analytics/summary", { params: { days: range } })
      setSummary(data)
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't load analytics.", "error")
    } finally {
      setLoading(false)
    }
  }

  const maxDaily = summary ? Math.max(1, ...summary.daily.map((d) => d.count)) : 1
  const maxAction = summary?.by_action.length ? Math.max(...summary.by_action.map((a) => a.count)) : 1

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <Icon name="monitoring" size={19} filled />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-text">{t("analytics.title")}</h2>
            <p className="text-xs text-text-muted">{t("analytics.description")}</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === r ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      )}

      {!loading && summary && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="card-surface rounded-2xl p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Icon name="bolt" size={14} />
                {t("analytics.totalActions")}
              </p>
              <p className="text-2xl font-extrabold text-text">{summary.total_period}</p>
              <p className="text-xs text-text-muted">{t("analytics.last")} {summary.days} {t("analytics.days")}</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Icon name="today" size={14} />
                {t("analytics.today")}
              </p>
              <p className="text-2xl font-extrabold text-text">
                {summary.used_today}
                {summary.daily_limit !== null && (
                  <span className="text-base font-semibold text-text-muted"> / {summary.daily_limit}</span>
                )}
              </p>
              <p className="text-xs text-text-muted">
                {summary.daily_limit === null ? t("analytics.unlimited") : t("analytics.dailyLimit")}
              </p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Icon name="local_fire_department" size={14} />
                {t("analytics.busiestDay")}
              </p>
              <p className="text-2xl font-extrabold text-text">
                {summary.busiest_day ? summary.busiest_day.count : "—"}
              </p>
              <p className="text-xs text-text-muted">
                {summary.busiest_day ? formatShortDate(summary.busiest_day.date) : t("analytics.noActivity")}
              </p>
            </div>
          </div>

          <div className="card-surface rounded-2xl p-4">
            <h3 className="mb-4 text-sm font-semibold text-text">{t("analytics.activityOverTime")}</h3>
            {summary.total_period === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">{t("analytics.noActivityRange")}</p>
            ) : (
              <div className="flex items-end gap-[3px]" style={{ height: 140 }}>
                {summary.daily.map((d, i) => (
                  <div
                    key={d.date}
                    className="group relative flex-1"
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                  >
                    <div
                      className={`w-full rounded-t transition-colors ${
                        d.count > 0 ? "bg-accent/70 group-hover:bg-accent" : "bg-white/5"
                      }`}
                      style={{ height: Math.max(2, (d.count / maxDaily) * 128) }}
                    />
                    {hoverIdx === i && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[11px] text-text shadow-xl">
                        {formatShortDate(d.date)} · {d.count}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-surface rounded-2xl p-4">
            <h3 className="mb-4 text-sm font-semibold text-text">{t("analytics.byFeature")}</h3>
            {summary.by_action.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-muted">{t("analytics.noActivityRange")}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {summary.by_action.map((a, i) => (
                  <div key={a.action} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs text-text-muted">{a.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(a.count / maxAction) * 100}%`,
                          background: ACTION_COLORS[i % ACTION_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-semibold text-text">{a.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
