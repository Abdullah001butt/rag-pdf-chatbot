import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"

const TYPED_WORDS = ["you.", "students.", "legal teams.", "researchers.", "freelancers.", "HR teams."]

const CASES = [
  {
    icon: "🎓",
    title: "Students",
    body: "Turn dense textbooks and lecture PDFs into summaries, study notes, quizzes, and flashcards before an exam.",
  },
  {
    icon: "⚖️",
    title: "Legal & Contracts",
    body: "Pull out obligations, deadlines, and risky clauses from contracts and leases — every claim cited to a page.",
  },
  {
    icon: "🏠",
    title: "Real Estate",
    body: "Compare listing agreements and disclosures side by side, fill in forms, and get paperwork e-signed.",
  },
  {
    icon: "🔬",
    title: "Researchers",
    body: "Ask a research question across dozens of papers and get a synthesized report with sub-question citations.",
  },
  {
    icon: "🧑‍💼",
    title: "HR & Ops",
    body: "Fill offer letters and policy forms, and redact PII before sharing employee documents externally.",
  },
  {
    icon: "🧾",
    title: "Freelancers & Small Business",
    body: "Redact client details before sharing files, batch-summarize project docs, and get invoices signed fast.",
  },
]

export function UseCases() {
  return (
    <section className="px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Who it's for</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Built for{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          <Typewriter words={TYPED_WORDS} cursorClassName="bg-emerald-400" />
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">
        Same document toolkit, wherever paperwork slows you down.
      </p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-lg">
              {c.icon}
            </div>
            <h3 className="mb-2 text-base font-bold text-white">{c.title}</h3>
            <p className="text-sm leading-relaxed text-white/50">{c.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
