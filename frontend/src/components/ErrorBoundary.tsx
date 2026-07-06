import * as React from "react"

interface Props {
  children: React.ReactNode
  fallbackTitle?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Documind UI error:", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-sm text-text">
          <p className="mb-1 font-semibold text-danger">
            {this.props.fallbackTitle || "Something went wrong rendering this section."}
          </p>
          <p className="text-text-muted">{this.state.error.message}</p>
          <button
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-white/5"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
