import * as React from "react"
import { useNavigate } from "react-router-dom"
import { api, getStoredApiKey, setStoredApiKey, type BillingStatus } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
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
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">Account</div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <div className="mb-2 font-bold text-text">{user?.username}</div>
          <Badge variant={billing?.tier === "pro" ? "pro" : "default"}>{billing?.label ?? "Free"} Plan</Badge>
          {billing?.tier === "free" && (
            <p className="mt-2 text-xs text-text-muted">
              Usage today: {billing?.used_today} / {billing?.daily_actions} actions
            </p>
          )}
        </div>
        {billing?.tier === "free" ? (
          <Button className="mt-2 w-full" onClick={handleUpgrade} disabled={checkingOut}>
            {checkingOut ? "Redirecting to Stripe..." : "⭐ Upgrade to Pro"}
          </Button>
        ) : (
          <>
            <p className="mt-2 text-xs text-text-muted">Unlimited daily actions ✓</p>
            <Button variant="outline" className="mt-2 w-full" onClick={handleManageBilling} disabled={managingBilling}>
              {managingBilling ? "Opening..." : "Manage Billing"}
            </Button>
          </>
        )}
        <Button variant="outline" className="mt-2 w-full" onClick={() => navigate("/account")}>
          Account Settings
        </Button>
        <Button variant="outline" className="mt-2 w-full" onClick={logout}>
          Log Out
        </Button>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">Google API Key</div>
        <div className="flex gap-1">
          <Input
            type={showApiKey ? "text" : "password"}
            placeholder="Enter your Google API Key"
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
          Click{" "}
          <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-accent underline">
            here
          </a>{" "}
          to get an API key. Stored only in your browser.
        </p>
        {!apiKey && <p className="mt-1 text-xs text-warning">⚠ Required for chat and all AI features.</p>}
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted">Documents</div>
        <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleUpload} className="hidden" id="pdf-upload" />
        <Button
          className="w-full cursor-pointer"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {uploading ? "Uploading..." : "Upload PDFs"}
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
          {files.length === 0 && <li className="text-xs text-text-muted">No documents uploaded yet.</li>}
        </ul>
      </div>
    </aside>
  )
}
