import axios from "axios"

export const API_KEY_STORAGE_KEY = "documind_gemini_api_key"
const ACCESS_TOKEN_KEY = "documind_token"
const REFRESH_TOKEN_KEY = "documind_refresh_token"

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || ""
}

export function setStoredApiKey(key: string) {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key)
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  // Also drop the cached user object — otherwise AuthContext sees a stale
  // "logged in" user with no valid tokens, bounces to /dashboard, 401s again,
  // fails to refresh (no refresh token left), and redirects to /login in a loop.
  localStorage.removeItem("documind_user")
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const apiKey = getStoredApiKey()
  if (apiKey) {
    config.headers["X-Gemini-Api-Key"] = apiKey
  }
  return config
})

// Refresh-on-401: a single in-flight refresh is shared by any requests that
// arrive while it's pending, so a burst of 401s doesn't fire N refresh calls.
let refreshPromise: Promise<string | null> | null = null

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken })
    setTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    clearTokens()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthEndpoint = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/signup") || original?.url?.includes("/auth/refresh")

    if (error.response?.status === 401 && !original._retried && !isAuthEndpoint) {
      original._retried = true
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null
        })
      }
      const newAccessToken = await refreshPromise
      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return api(original)
      }
      clearTokens()
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export interface User {
  id: number
  username: string
  email: string
  tier: "free" | "pro"
  email_verified: boolean
}

export interface BillingStatus {
  tier: string
  label: string
  max_pdfs: number | null
  daily_actions: number | null
  used_today: number
  locked_features: string[]
}

export interface ChatMessage {
  question: string
  answer: string
  citations: string
  timestamp?: string
}

export interface QuizQuestion {
  question: string
  options: Record<string, string>
  correct: string
  explanation: string
}

export interface Flashcard {
  front: string
  back: string
}
