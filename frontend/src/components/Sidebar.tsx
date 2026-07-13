import * as React from "react"
import { useNavigate } from "react-router-dom"
import { api, getStoredApiKey, setStoredApiKey, type BillingStatus } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface SidebarProps {
  files: string[]
  onFilesChanged: (files: string[]) => void
  billing: BillingStatus | null
  onBillingChanged: (b: BillingStatus) => void
}

export function Sidebar({ files, onFilesChanged, billing }: SidebarProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
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
    setError(null)
    setUploading(true)
    const formData = new FormData()
    Array.from(selected).forEach((f) => formData.append("files", f))
    try {
      const { data } = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      onFilesChanged(data.files)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed.")
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
      setError(err?.response?.data?.detail || "Couldn't start checkout. Please try again.")
      setCheckingOut(false)
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true)
    try {
      const { data } = await api.post("/billing/portal")
      window.location.href = data.portal_url
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't open the billing portal.")
      setManagingBilling(false)
    }
  }

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-white/10 bg-black p-5 md:w-72">
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">{t("sidebar.account")}</div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <div className="mb-2 font-bold text-text">{user?.username}</div>
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
            {checkingOut ? t("sidebar.redirecting") : t("sidebar.upgradeToPro")}
          </Button>
        ) : (
          <>
            <p className="mt-2 text-xs text-text-muted">{t("sidebar.unlimitedActions")}</p>
            <Button variant="outline" className="mt-2 w-full" onClick={handleManageBilling} disabled={managingBilling}>
              {managingBilling ? t("sidebar.opening") : t("sidebar.manageBilling")}
            </Button>
          </>
        )}
        <Button variant="outline" className="mt-2 w-full" onClick={() => navigate("/account")}>
          {t("sidebar.accountSettings")}
        </Button>
        <Button variant="outline" className="mt-2 w-full" onClick={logout}>
          {t("sidebar.logOut")}
        </Button>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">{t("sidebar.googleApiKey")}</div>
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
            className="shrink-0 rounded-lg border border-white/10 px-2 text-xs text-text-muted hover:bg-white/5"
            title={showApiKey ? "Hide" : "Show"}
          >
            {showApiKey ? "🙈" : "👁"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          {t("sidebar.apiKeyHelp1")}{" "}
          <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-accent underline">
            {t("sidebar.apiKeyHelp2")}
          </a>{" "}
          {t("sidebar.apiKeyHelp3")}
        </p>
        {!apiKey && <p className="mt-1 text-xs text-warning">{t("sidebar.apiKeyRequired")}</p>}
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">{t("sidebar.documents")}</div>
        <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleUpload} className="hidden" id="pdf-upload" />
        <Button
          className="w-full cursor-pointer"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {uploading ? t("sidebar.uploading") : t("sidebar.uploadPdfs")}
        </Button>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <ul className="mt-3 flex flex-col gap-1.5">
          {files.map((f) => (
            <li
              key={f}
              className="truncate rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-xs text-text-muted"
              title={f}
            >
              📄 {f}
            </li>
          ))}
          {files.length === 0 && <li className="text-xs text-text-muted">{t("sidebar.noDocuments")}</li>}
        </ul>
      </div>
    </aside>
  )
}
