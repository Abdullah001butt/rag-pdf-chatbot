import * as React from "react"
import { api, setTokens, clearTokens, getRefreshToken, type User } from "@/lib/api"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshTier: (tier: string) => void
  updateUser: (user: User) => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => {
    const stored = localStorage.getItem("documind_user")
    return stored ? JSON.parse(stored) : null
  })
  const [loading] = React.useState(false)

  function persist(accessToken: string, refreshToken: string, user: User) {
    setTokens(accessToken, refreshToken)
    localStorage.setItem("documind_user", JSON.stringify(user))
    setUser(user)
  }

  async function login(username: string, password: string) {
    const { data } = await api.post("/auth/login", { username, password })
    persist(data.access_token, data.refresh_token, data.user)
  }

  async function signup(username: string, email: string, password: string) {
    const { data } = await api.post("/auth/signup", { username, email, password })
    persist(data.access_token, data.refresh_token, data.user)
  }

  function logout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {})
    }
    clearTokens()
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

  function updateUser(next: User) {
    localStorage.setItem("documind_user", JSON.stringify(next))
    setUser(next)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshTier, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
