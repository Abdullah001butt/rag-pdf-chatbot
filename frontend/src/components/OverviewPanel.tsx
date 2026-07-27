import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { Icon } from "@/components/ui/icon"
import type { BillingStatus } from "@/lib/api"

interface QuickLink {
  key: string
  icon: string
  labelKey: string
  color: string
}

const QUICK_LINKS: QuickLink[] = [
  { key: "chat", icon: "chat", labelKey: "dash.tab.chat", color: "#10b981" },
  { key: "summary", icon: "summarize", labelKey: "dash.tab.summary", color: "#10b981" },
  { key: "graph", icon: "hub", labelKey: "dash.tab.graph", color: "#3b82f6" },
  { key: "audio", icon: "podcasts", labelKey: "dash.tab.audio", color: "#3b82f6" },
  { key: "agent", icon: "smart_toy", labelKey: "dash.tab.agent", color: "#f59e0b" },
  { key: "automations", icon: "cycle", labelKey: "dash.tab.automations", color: "#f59e0b" },
  { key: "workspaces", icon: "groups", labelKey: "dash.tab.workspaces", color: "#a78bfa" },
  { key: "analytics", icon: "monitoring", labelKey: "dash.tab.analytics", color: "#ec4899" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

interface OverviewPanelProps {
  files: string[]
  billing: BillingStatus | null
  onNavigate: (tab: string) => void
}

export function OverviewPanel({ files, billing, onNavigate }: OverviewPanelProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? "overview.morning" : hour < 18 ? "overview.afternoon" : "overview.evening"

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-white/10 p-6">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{ background: "radial-gradient(ellipse 70% 100% at 0% 0%, rgba(16,185,129,0.18), transparent 60%)" }}
        />
        <p className="text-xl font-extrabold text-text">
          {t(greetingKey)}, {user?.username} <span className="text-accent">👋</span>
        </p>
        <p className="mt-1 text-sm text-text-muted">{t("overview.subtitle")}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card-surface rounded-2xl p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <Icon name="description" size={14} />
            {t("overview.documents")}
          </p>
          <p className="text-2xl font-extrabold text-text">{files.length}</p>
        </div>
        <div className="card-surface rounded-2xl p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <Icon name="workspace_premium" size={14} />
            {t("overview.plan")}
          </p>
          <p className="text-2xl font-extrabold text-text">{billing?.label ?? "Free"}</p>
        </div>
        <div className="card-surface rounded-2xl p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <Icon name="bolt" size={14} />
            {t("overview.usageToday")}
          </p>
          <p className="text-2xl font-extrabold text-text">
            {billing?.used_today ?? 0}
            {billing?.daily_actions != null && <span className="text-base font-semibold text-text-muted"> / {billing.daily_actions}</span>}
          </p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <h3 className="mb-3 text-sm font-semibold text-text">{t("overview.quickActions")}</h3>
        <motion.div variants={container} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <motion.button
              key={link.key}
              variants={item}
              whileHover={{ y: -3 }}
              onClick={() => onNavigate(link.key)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition-colors hover:bg-white/[0.05]"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${link.color}22`, color: link.color }}
              >
                <Icon name={link.icon} size={19} />
              </span>
              <span className="text-sm font-semibold text-text">{t(link.labelKey)}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {files.length === 0 && (
        <motion.div
          variants={item}
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 p-8 text-center"
        >
          <Icon name="upload_file" size={26} className="text-text-muted" />
          <p className="text-sm font-semibold text-text">{t("overview.noDocsTitle")}</p>
          <p className="text-xs text-text-muted">{t("overview.noDocsBody")}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
