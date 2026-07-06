import axios from "axios"

export const API_KEY_STORAGE_KEY = "documind_gemini_api_key"

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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("documind_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const apiKey = getStoredApiKey()
  if (apiKey) {
    config.headers["X-Gemini-Api-Key"] = apiKey
  }
  return config
})

export interface User {
  id: number
  username: string
  email: string
  tier: "free" | "pro"
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
