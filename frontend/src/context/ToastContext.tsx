import * as React from "react"
import { Icon } from "@/components/ui/icon"

type ToastVariant = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

const VARIANT_STYLES: Record<ToastVariant, { border: string; bg: string; text: string; icon: string }> = {
  success: { border: "border-success/30", bg: "bg-success/10", text: "text-success", icon: "check_circle" },
  error: { border: "border-danger/30", bg: "bg-danger/10", text: "text-danger", icon: "error" },
  info: { border: "border-accent/30", bg: "bg-accent/10", text: "text-accent", icon: "info" },
}

let idCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function toast(message: string, variant: ToastVariant = "info") {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => dismiss(id), 5000)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border ${style.border} ${style.bg} card-surface px-4 py-3 text-sm text-text shadow-xl backdrop-blur-md animate-[toast-in_0.2s_ease-out]`}
            >
              <Icon name={style.icon} size={18} className={`mt-0.5 shrink-0 ${style.text}`} filled />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-full p-0.5 text-text-muted hover:bg-white/10 hover:text-text"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
