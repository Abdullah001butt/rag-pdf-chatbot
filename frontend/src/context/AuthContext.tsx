import * as React from "react"
import { api, type User } from "@/lib/api"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshTier: (tier: string) => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => {
    const stored = localStorage.getItem("documind_user")
    return stored ? JSON.parse(stored) : null
  })
  const [loading] = React.useState(false)

  function persist(token: string, user: User) {
    localStorage.setItem("documind_token", token)
    localStorage.setItem("documind_user", JSON.stringify(user))
    setUser(user)
  }

  async function login(username: string, password: string) {
    const { data } = await api.post("/auth/login", { username, password })
    persist(data.access_token, data.user)
  }

  async function signup(username: string, email: string, password: string) {
    const { data } = await api.post("/auth/signup", { username, email, password })
    persist(data.access_token, data.user)
  }

  function logout() {
    localStorage.removeItem("documind_token")
    localStorage.removeItem("documind_user")
    setUser(null)
  }

  function refreshTier(tier: string) {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, tier: tier as User["tier"] }
      localStorage.setItem("documind_user", JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshTier }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
