import * as React from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Card, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"

interface ApiKeyInfo {
  id: number
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

export default function AccountSettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [passwordMsg, setPasswordMsg] = React.useState<string | null>(null)
  const [passwordErr, setPasswordErr] = React.useState<string | null>(null)
  const [passwordBusy, setPasswordBusy] = React.useState(false)

  const [newEmail, setNewEmail] = React.useState("")
  const [emailPassword, setEmailPassword] = React.useState("")
  const [emailMsg, setEmailMsg] = React.useState<string | null>(null)
  const [emailErr, setEmailErr] = React.useState<string | null>(null)
  const [emailBusy, setEmailBusy] = React.useState(false)

  const [resendMsg, setResendMsg] = React.useState<string | null>(null)
  const [resendBusy, setResendBusy] = React.useState(false)

  const [deletePassword, setDeletePassword] = React.useState("")
  const [deleteErr, setDeleteErr] = React.useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

  const isPro = user?.tier === "pro"
  const [apiKeys, setApiKeys] = React.useState<ApiKeyInfo[]>([])
  const [apiKeysLoading, setApiKeysLoading] = React.useState(false)
  const [newKeyName, setNewKeyName] = React.useState("")
  const [creatingKey, setCreatingKey] = React.useState(false)
  const [apiKeyErr, setApiKeyErr] = React.useState<string | null>(null)
  const [justCreatedKey, setJustCreatedKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isPro) loadApiKeys()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro])

  async function loadApiKeys() {
    setApiKeysLoading(true)
    try {
      const { data } = await api.get("/api-keys")
      setApiKeys(data.keys || [])
    } catch {
      // silent — section just stays empty
    } finally {
      setApiKeysLoading(false)
    }
  }

  async function handleCreateApiKey() {
    setCreatingKey(true)
    setApiKeyErr(null)
    try {
      const { data } = await api.post("/api-keys", { name: newKeyName.trim() })
      setJustCreatedKey(data.key)
      setNewKeyName("")
      loadApiKeys()
    } catch (err: any) {
      setApiKeyErr(err?.response?.data?.detail || "Couldn't create the API key.")
    } finally {
      setCreatingKey(false)
    }
  }

  async function handleRevokeApiKey(id: number) {
    try {
      await api.delete(`/api-keys/${id}`)
      setApiKeys((prev) => prev.filter((k) => k.id !== id))
    } catch (err: any) {
      setApiKeyErr(err?.response?.data?.detail || "Couldn't revoke that key.")
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordErr(null)
    setPasswordMsg(null)
    setPasswordBusy(true)
    try {
      const { data } = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordMsg(data.message)
      setCurrentPassword("")
      setNewPassword("")
    } catch (err: any) {
      setPasswordErr(err?.response?.data?.detail || "Something went wrong.")
    } finally {
      setPasswordBusy(false)
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailErr(null)
    setEmailMsg(null)
    setEmailBusy(true)
    try {
      const { data } = await api.post("/auth/change-email", {
        new_email: newEmail,
        current_password: emailPassword,
      })
      updateUser(data)
      setEmailMsg("Email updated. Please verify your new address — a link has been sent.")
      setNewEmail("")
      setEmailPassword("")
    } catch (err: any) {
      setEmailErr(err?.response?.data?.detail || "Something went wrong.")
    } finally {
      setEmailBusy(false)
    }
  }

  async function handleResendVerification() {
    setResendBusy(true)
    setResendMsg(null)
    try {
      const { data } = await api.post("/auth/resend-verification")
      setResendMsg(data.message)
    } catch (err: any) {
      setResendMsg(err?.response?.data?.detail || "Something went wrong.")
    } finally {
      setResendBusy(false)
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    setDeleteErr(null)
    setDeleteBusy(true)
    try {
      await api.delete("/auth/account", { data: { password: deletePassword } })
      logout()
      navigate("/")
    } catch (err: any) {
      setDeleteErr(err?.response?.data?.detail || "Something went wrong.")
      setDeleteBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Account Settings</h1>
          <p className="text-sm text-text-muted">Manage your account for {user?.username}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </Button>
      </div>

      {user && !user.email_verified && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <span className="text-text">⚠ Your email address isn't verified yet.</span>
          <Button variant="outline" onClick={handleResendVerification} disabled={resendBusy}>
            {resendBusy ? "Sending..." : "Resend Verification"}
          </Button>
        </div>
      )}
      {resendMsg && <p className="text-xs text-text-muted">{resendMsg}</p>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Profile</h2>
            <Badge variant={user?.tier === "pro" ? "pro" : "default"}>{user?.tier === "pro" ? "Pro" : "Free"} Plan</Badge>
          </div>
        </CardHeader>
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-text">
            <span className="text-text-muted">Username:</span> {user?.username}
          </p>
          <p className="text-text">
            <span className="text-text-muted">Email:</span> {user?.email}{" "}
            {user?.email_verified ? <span className="text-success">✓ verified</span> : <span className="text-warning">unverified</span>}
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Change Password</h2>
        </CardHeader>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {passwordErr && <p className="text-sm text-danger">{passwordErr}</p>}
          {passwordMsg && <p className="text-sm text-success">{passwordMsg}</p>}
          <Button type="submit" disabled={passwordBusy} className="self-start">
            {passwordBusy ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Change Email</h2>
        </CardHeader>
        <form onSubmit={handleChangeEmail} className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Current password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            required
          />
          {emailErr && <p className="text-sm text-danger">{emailErr}</p>}
          {emailMsg && <p className="text-sm text-success">{emailMsg}</p>}
          <Button type="submit" disabled={emailBusy} className="self-start">
            {emailBusy ? "Updating..." : "Update Email"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">API Keys</h2>
            {!isPro && <Badge variant="warning">Pro feature</Badge>}
          </div>
        </CardHeader>

        {!isPro ? (
          <p className="text-sm text-text-muted">
            Upgrade to Pro to generate personal access keys and call the Documind AI public API (/v1) from your own scripts and apps.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Use a key with the <code className="rounded bg-white/10 px-1 py-0.5 text-xs">X-Api-Key</code> header to call{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs">/v1/documents/upload</code>,{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs">/v1/chat/ask</code>, and{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs">/v1/generate/*</code>.
            </p>

            {justCreatedKey && (
              <div className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/10 p-3">
                <p className="text-xs font-semibold text-accent">
                  Copy this key now — you won't be able to see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-black/40 px-2 py-1.5 text-xs text-text">{justCreatedKey}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(justCreatedKey)
                      setJustCreatedKey(null)
                    }}
                    className="shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-1.5 text-accent"
                  >
                    <Icon name="content_copy" size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input placeholder="Key name (optional)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              <Button onClick={handleCreateApiKey} disabled={creatingKey || apiKeys.length >= 5} className="shrink-0">
                <Icon name="add" size={16} />
                {creatingKey ? "Creating..." : "New Key"}
              </Button>
            </div>
            {apiKeyErr && <p className="text-sm text-danger">{apiKeyErr}</p>}

            {apiKeysLoading && <p className="text-xs text-text-muted">Loading...</p>}
            {!apiKeysLoading && apiKeys.length === 0 && (
              <p className="text-xs text-text-muted">No API keys yet.</p>
            )}
            <div className="flex flex-col gap-1.5">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">
                      {k.name || "Unnamed key"} <span className="text-text-muted">· {k.key_prefix}…</span>
                    </p>
                    <p className="text-xs text-text-muted">
                      Created {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used_at ? ` · last used ${new Date(k.last_used_at).toLocaleDateString()}` : " · never used"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeApiKey(k.id)}
                    className="shrink-0 rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-danger"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
        </CardHeader>
        {!confirmingDelete ? (
          <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
            Delete Account
          </Button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              This permanently deletes your account, documents, and chat history. Enter your password to confirm.
            </p>
            <Input
              type="password"
              placeholder="Password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
            />
            {deleteErr && <p className="text-sm text-danger">{deleteErr}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={deleteBusy}>
                {deleteBusy ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
