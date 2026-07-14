import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = React.useState<"pending" | "success" | "error">("pending")
  const [errorDetail, setErrorDetail] = React.useState("")
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { updateUser } = useAuth()

  React.useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorDetail(t("auth.verifyMissingToken"))
      return
    }
    api
      .post("/auth/verify-email", { token })
      .then(async () => {
        setStatus("success")
        // Refresh the cached user so the "verify your email" banner clears
        // immediately instead of waiting for the next login.
        try {
          const { data } = await api.get("/auth/me")
          updateUser(data)
        } catch {
          // Not logged in on this device/browser — nothing to refresh.
        }
      })
      .catch((err) => {
        setStatus("error")
        setErrorDetail(err?.response?.data?.detail || t("auth.verifyInvalid"))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Documind AI" className="h-14 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <h1 className="text-xl font-bold text-text">{t("auth.emailVerification")}</h1>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">{t("auth.verifyEmailHeading")}</h2>
          </CardHeader>

          <div className="flex flex-col items-center gap-4 text-center">
            {status === "pending" && <LoadingState label={t("auth.verifyingEmail")} />}
            {status === "success" && <p className="text-sm text-success">{t("auth.emailVerified")}</p>}
            {status === "error" && <p className="text-sm text-danger">{errorDetail}</p>}

            {status !== "pending" && (
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                {t("auth.goToDashboard")}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
