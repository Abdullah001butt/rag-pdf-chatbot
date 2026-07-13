import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { Card, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export default function AuthPage() {
  const [mode, setMode] = React.useState<"login" | "signup">("login")
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const { login, signup } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === "login") {
        await login(username, password)
      } else {
        await signup(username, email, password)
      }
      navigate("/dashboard")
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Documind AI" className="h-14 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <div>
            <h1 className="text-xl font-bold text-text">Documind AI</h1>
            <p className="text-sm text-text-muted">{t("auth.appTagline")}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-2 rounded-lg bg-surface p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${mode === "login" ? "bg-accent text-white" : "text-text-muted"}`}
              >
                {t("auth.login")}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-accent text-white" : "text-text-muted"}`}
              >
                {t("auth.signup")}
              </button>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input placeholder={t("auth.username")} value={username} onChange={(e) => setUsername(e.target.value)} required />
            {mode === "signup" && (
              <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            <Input type="password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} required />

            {mode === "login" && (
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="self-end text-xs font-semibold text-accent hover:underline"
              >
                {t("auth.forgotPassword")}
              </button>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={busy} className="mt-2 w-full">
              {busy ? t("auth.pleaseWait") : mode === "login" ? t("auth.login") : t("auth.createAccount")}
            </Button>

            {mode === "signup" && (
              <p className="text-center text-xs text-text-muted">
                {t("auth.consentPrefix")}{" "}
                <button type="button" onClick={() => navigate("/terms")} className="text-accent hover:underline">
                  {t("footer.terms")}
                </button>{" "}
                {t("auth.consentAnd")}{" "}
                <button type="button" onClick={() => navigate("/privacy")} className="text-accent hover:underline">
                  {t("footer.privacy")}
                </button>
                .
              </p>
            )}
          </form>
        </Card>
      </div>
    </div>
  )
}
