import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Card, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [done, setDone] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const navigate = useNavigate()
  const { t } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch"))
      return
    }

    setBusy(true)
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword })
      setDone(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-danger">{t("auth.missingToken")}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Documind AI" className="h-14 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <div>
            <h1 className="text-xl font-bold text-text">{t("auth.newPasswordTitle")}</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">{t("auth.resetPasswordHeading")}</h2>
          </CardHeader>

          {done ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-success">{t("auth.resetSuccess")}</p>
              <Button className="w-full" onClick={() => navigate("/login")}>
                {t("auth.login")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="password"
                placeholder={t("auth.newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" disabled={busy} className="mt-2 w-full">
                {busy ? t("auth.resetting") : t("auth.resetPassword")}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
