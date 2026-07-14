import * as React from "react"
import { useNavigate } from "react-router-dom"
import { api, getStoredApiKey, setStoredApiKey, type BillingStatus } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/ui/icon"

interface SidebarProps {
  files: string[]
  onFilesChanged: (files: string[]) => void
  billing: BillingStatus | null
  onBillingChanged: (b: BillingStatus) => void
}

export function Sidebar({ files, onFilesChanged, billing }: SidebarProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [uploading, setUploading] = React.useState(false)
  const [apiKey, setApiKey] = React.useState(() => getStoredApiKey())
  const [showApiKey, setShowApiKey] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleApiKeyChange(value: string) {
    setApiKey(value)
    setStoredApiKey(value)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return
    setUploading(true)
    const formData = new FormData()
    Array.from(selected).forEach((f) => formData.append("files", f))
    try {
      const { data } = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      onFilesChanged(data.files)
      toast(
        selected.length === 1 ? `"${selected[0].name}" uploaded.` : `${selected.length} files uploaded.`,
        "success"
      )
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Upload failed.", "error")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const [checkingOut, setCheckingOut] = React.useState(false)
  const [managingBilling, setManagingBilling] = React.useState(false)

  async function handleUpgrade() {
    setCheckingOut(true)
    try {
      const { data } = await api.post("/billing/checkout")
      window.location.href = data.checkout_url
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't start checkout. Please try again.", "error")
      setCheckingOut(false)
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true)
    try {
      const { data } = await api.post("/billing/portal")
      window.location.href = data.portal_url
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't open the billing portal.", "error")
      setManagingBilling(false)
    }
  }

  return (
    <aside className="scrollbar-thin flex h-full w-full flex-col gap-6 overflow-y-auto border-r border-white/10 bg-surface p-5 md:w-72">
      <div className="hidden items-center gap-2.5 border-b border-white/8 pb-4 md:flex">
        <img src="/logo.png" alt="Documind AI" className="h-8 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div>
          <p className="text-sm font-extrabold leading-tight text-text">
            Documind <span className="text-accent">AI</span>
          </p>
          <p className="text-[11px] text-text-muted">{t("dash.tagline")}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
          <Icon name="account_circle" size={16} />
          {t("sidebar.account")}
        </div>
        <div className="card-surface rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2 font-bold text-text">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              {(user?.username || "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate">{user?.username}</span>
          </div>
          <Badge variant={billing?.tier === "pro" ? "pro" : "default"}>
            {billing?.label ?? "Free"} {t("sidebar.plan")}
          </Badge>
          {billing?.tier === "free" && (
            <p className="mt-2 text-xs text-text-muted">
              {t("sidebar.usageToday")}: {billing?.used_today} / {billing?.daily_actions} {t("sidebar.actions")}
            </p>
          )}
        </div>
        {billing?.tier === "free" ? (
          <Button className="mt-2 w-full" onClick={handleUpgrade} disabled={checkingOut}>
            <Icon name="workspace_premium" size={17} />
            {checkingOut ? t("sidebar.redirecting") : t("sidebar.upgradeToPro")}
          </Button>
        ) : (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
              <Icon name="verified" size={15} className="text-accent" />
              {t("sidebar.unlimitedActions")}
            </p>
            <Button variant="outline" className="mt-2 w-full" onClick={handleManageBilling} disabled={managingBilling}>
              <Icon name="credit_card" size={17} />
              {managingBilling ? t("sidebar.opening") : t("sidebar.manageBilling")}
            </Button>
          </>
        )}
        <Button variant="outline" className="mt-2 w-full" onClick={() => navigate("/account")}>
          <Icon name="settings" size={17} />
          {t("sidebar.accountSettings")}
        </Button>
        <Button variant="outline" className="mt-2 w-full" onClick={logout}>
          <Icon name="logout" size={17} />
          {t("sidebar.logOut")}
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
          <Icon name="key" size={16} />
          {t("sidebar.googleApiKey")}
        </div>
        <div className="flex gap-1">
          <Input
            type={showApiKey ? "text" : "password"}
            placeholder={t("sidebar.apiKeyPlaceholder")}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowApiKey((s) => !s)}
            className="shrink-0 rounded-lg border border-white/10 px-2 text-text-muted hover:bg-white/5"
            title={showApiKey ? "Hide" : "Show"}
          >
            <Icon name={showApiKey ? "visibility_off" : "visibility"} size={17} />
          </button>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          {t("sidebar.apiKeyHelp1")}{" "}
          <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-accent underline">
            {t("sidebar.apiKeyHelp2")}
          </a>{" "}
          {t("sidebar.apiKeyHelp3")}
        </p>
        {!apiKey && (
          <p className="mt-1 flex items-center gap-1 text-xs text-warning">
            <Icon name="warning" size={14} />
            {t("sidebar.apiKeyRequired")}
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
          <Icon name="description" size={16} />
          {t("sidebar.documents")}
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleUpload} className="hidden" id="pdf-upload" />
        <Button
          className="w-full cursor-pointer"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Icon name="upload_file" size={17} />
          {uploading ? t("sidebar.uploading") : t("sidebar.uploadPdfs")}
        </Button>
        <ul className="mt-3 flex flex-col gap-1.5">
          {files.map((f) => (
            <li
              key={f}
              className="flex items-center gap-1.5 truncate rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-xs text-text-muted"
              title={f}
            >
              <Icon name="picture_as_pdf" size={15} className="shrink-0 text-danger/80" />
              <span className="truncate">{f}</span>
            </li>
          ))}
          {files.length === 0 && <li className="text-xs text-text-muted">{t("sidebar.noDocuments")}</li>}
        </ul>
      </div>
    </aside>
  )
}
