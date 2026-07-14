import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Typewriter } from "@/components/landing/Typewriter"
import { useLanguage } from "@/context/LanguageContext"

const TYPED_KEYS = ["pricing.typed.ready", "pricing.typed.youWant", "pricing.typed.needed"]

const TIERS = [
  {
    labelKey: "pricing.free.label",
    price: "$0",
    suffixKey: "pricing.free.suffix",
    featureKeys: ["pricing.free.f1", "pricing.free.f2", "pricing.free.f3", "pricing.free.f4", "pricing.free.f5"],
    ctaKey: "pricing.free.cta",
    highlighted: false,
  },
  {
    labelKey: "pricing.pro.label",
    price: "$4.99",
    suffixKey: "pricing.pro.suffix",
    badgeKey: "pricing.pro.badge",
    // Keep in sync with backend/.env STRIPE_PRO_PRICE_AMOUNT (cents)
    featureKeys: [
      "pricing.pro.f1",
      "pricing.pro.f2",
      "pricing.pro.f3",
      "pricing.pro.f4",
      "pricing.pro.f5",
      "pricing.pro.f6",
      "pricing.pro.f7",
    ],
    ctaKey: "pricing.pro.cta",
    highlighted: true,
  },
]

export function Pricing() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const typedWords = TYPED_KEYS.map((k) => t(k))

  return (
    <section id="pricing" className="px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{t("pricing.eyebrow")}</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {t("pricing.headlinePrefix")}{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={typedWords} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">{t("pricing.subtitle")}</p>

      <div className="mx-auto mt-16 grid max-w-3xl gap-6 md:grid-cols-2">
        {TIERS.map((tier, i) => (
          <motion.div
            key={tier.labelKey}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative rounded-2xl border p-8 text-left ${
              tier.highlighted ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {tier.badgeKey && (
              <span className="absolute -top-3 right-8 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-black">
                {t(tier.badgeKey)}
              </span>
            )}
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">{t(tier.labelKey)}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{tier.price}</span>
              <span className="text-sm text-white/40">{t(tier.suffixKey)}</span>
            </div>
            <ul className="mt-6 flex flex-col gap-3">
              {tier.featureKeys.map((fk) => (
                <li key={fk} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="mt-0.5 text-emerald-400">●</span>
                  {t(fk)}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/login")}
              className={`mt-8 w-full rounded-full py-3 text-sm font-bold transition-transform hover:scale-[1.02] ${
                tier.highlighted ? "bg-emerald-400 text-black" : "border border-white/20 text-white"
              }`}
            >
              {t(tier.ctaKey)}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
