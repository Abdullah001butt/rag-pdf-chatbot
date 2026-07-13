import { useNavigate } from "react-router-dom"

export function LandingNav() {
  const navigate = useNavigate()

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Documind AI" className="h-8 w-8 rounded-lg object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="text-lg font-extrabold text-white">
            Documind <span className="text-emerald-400">AI</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
          <button onClick={() => scrollTo("how-it-works")} className="transition-colors hover:text-white">
            How it works
          </button>
          <button onClick={() => scrollTo("editor")} className="transition-colors hover:text-white">
            Editor
          </button>
          <button onClick={() => scrollTo("pricing")} className="transition-colors hover:text-white">
            Pricing
          </button>
          <button onClick={() => scrollTo("faq")} className="transition-colors hover:text-white">
            FAQ
          </button>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
        >
          Sign In
        </button>
      </div>
    </nav>
  )
}
