import { useNavigate } from "react-router-dom"

export function LandingFooter() {
  const navigate = useNavigate()
  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <span>© {new Date().getFullYear()} Documind AI. All rights reserved.</span>
        <button onClick={() => navigate("/login")} className="font-semibold text-white/70 hover:text-white">
          Sign In →
        </button>
      </div>
    </footer>
  )
}
