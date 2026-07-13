import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Typewriter } from "@/components/landing/Typewriter"

const TYPED_WORDS = ["ready.", "you want.", "needed."]

const TIERS = [
  {
    label: "Free",
    price: "$0",
    suffix: "to evaluate",
    features: [
      "2 PDFs at a time",
      "15 actions per day",
      "Chat, Summaries & Study Notes",
      "Full PDF Editor Suite",
      "No credit card required",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    label: "Pro",
    price: "$4.99",
    suffix: "/ month",
    badge: "Best Value",
    // Keep in sync with backend/.env STRIPE_PRO_PRICE_AMOUNT (cents)
    features: [
      "Up to 10 PDFs at a time",
      "Unlimited daily actions",
      "Quiz, Flashcards & Compare",
      "Research Assistant",
      "All exports (.md / .csv)",
    ],
    cta: "Start Document Pro",
    highlighted: true,
  },
]

export function Pricing() {
  const navigate = useNavigate()

  return (
    <section id="pricing" className="px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Pricing</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Start free. Upgrade when{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={TYPED_WORDS} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">
        Pro is built for repeat work — unlimited usage and every feature unlocked.
      </p>

      <div className="mx-auto mt-16 grid max-w-3xl gap-6 md:grid-cols-2">
        {TIERS.map((tier, i) => (
          <motion.div
            key={tier.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative rounded-2xl border p-8 text-left ${
              tier.highlighted
                ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-3 right-8 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-black">
                {tier.badge}
              </span>
            )}
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">{tier.label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{tier.price}</span>
              <span className="text-sm text-white/40">{tier.suffix}</span>
            </div>
            <ul className="mt-6 flex flex-col gap-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="mt-0.5 text-emerald-400">●</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/login")}
              className={`mt-8 w-full rounded-full py-3 text-sm font-bold transition-transform hover:scale-[1.02] ${
                tier.highlighted ? "bg-emerald-400 text-black" : "border border-white/20 text-white"
              }`}
            >
              {tier.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
