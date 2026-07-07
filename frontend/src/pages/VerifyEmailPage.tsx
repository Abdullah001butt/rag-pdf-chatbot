import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/lib/api"
import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = React.useState<"pending" | "success" | "error">("pending")
  const [message, setMessage] = React.useState("")
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("This verification link is missing a token.")
      return
    }
    api
      .post("/auth/verify-email", { token })
      .then(({ data }) => {
        setStatus("success")
        setMessage(data.message)
      })
      .catch((err) => {
        setStatus("error")
        setMessage(err?.response?.data?.detail || "This verification link is invalid or has expired.")
      })
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Documind AI" className="h-14 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <h1 className="text-xl font-bold text-text">Email Verification</h1>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Verify Email</h2>
          </CardHeader>

          <div className="flex flex-col items-center gap-4 text-center">
            {status === "pending" && <LoadingState label="Verifying your email..." />}
            {status === "success" && <p className="text-sm text-success">{message}</p>}
            {status === "error" && <p className="text-sm text-danger">{message}</p>}

            {status !== "pending" && (
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
