import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Card, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const [mode, setMode] = React.useState<"login" | "signup">("login")
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const { login, signup } = useAuth()
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Documind AI" className="h-14 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
          <div>
            <h1 className="text-xl font-bold text-text">Documind AI</h1>
            <p className="text-sm text-text-muted">Sign in to access your documents and study tools</p>
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
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-accent text-white" : "text-text-muted"}`}
              >
                Sign Up
              </button>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            {mode === "signup" && (
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={busy} className="mt-2 w-full">
              {busy ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
