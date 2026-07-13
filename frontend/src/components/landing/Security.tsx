import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"

const TYPED_WORDS = ["private.", "yours.", "secure.", "off our disk."]

const POINTS = [
  {
    icon: "🔑",
    title: "Your API key never leaves your browser",
    body: "It's stored in local storage and sent directly to Google for your requests — we never store it on our servers.",
  },
  {
    icon: "🧠",
    title: "Documents aren't permanently stored",
    body: "Uploaded PDFs live in memory for your session only. They're never written to disk or a database.",
  },
  {
    icon: "🔒",
    title: "Passwords are hashed, never stored plain",
    body: "Every password is hashed with bcrypt before it touches the database — we can't see or recover it, ever.",
  },
  {
    icon: "💳",
    title: "PCI-compliant billing",
    body: "Stripe handles all payment details directly. Your card number never reaches our servers.",
  },
  {
    icon: "🛡️",
    title: "Isolated per account",
    body: "Your documents, chat history, and edits are scoped to your account only, and never shared across users.",
  },
  {
    icon: "📧",
    title: "Encrypted end to end",
    body: "All traffic is served over HTTPS, with a verified sending domain for account and reset emails.",
  },
]

export function Security() {
  return (
    <section className="px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Security &amp; Privacy</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Built to keep your data{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={TYPED_WORDS} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">
        No fine print — this is exactly how your documents and account are handled.
      </p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-lg">
              {p.icon}
            </div>
            <h3 className="mb-2 text-base font-bold text-white">{p.title}</h3>
            <p className="text-sm leading-relaxed text-white/50">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
