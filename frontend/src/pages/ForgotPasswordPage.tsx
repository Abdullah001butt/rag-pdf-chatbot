import * as React from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Card, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const navigate = useNavigate()
  const { t } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.post("/auth/forgot-password", { email })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Documind AI" className="h-14 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <div>
            <h1 className="text-xl font-bold text-text">{t("auth.forgotTitle")}</h1>
            <p className="text-sm text-text-muted">{t("auth.forgotSubtitle")}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">{t("auth.forgotHeading")}</h2>
          </CardHeader>

          {sent ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-success">{t("auth.resetLinkSent")}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                {t("auth.backToLoginButton")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" disabled={busy} className="mt-2 w-full">
                {busy ? t("auth.sending") : t("auth.sendResetLink")}
              </Button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-xs font-semibold text-text-muted hover:text-text"
              >
                {t("auth.backToLogin")}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
