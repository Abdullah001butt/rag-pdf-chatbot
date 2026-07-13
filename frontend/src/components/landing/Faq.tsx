import { motion } from "framer-motion"
import * as React from "react"

const FAQS = [
  {
    q: "What kinds of documents can I upload?",
    a: "Any PDF — contracts, leases, reports, policy docs, even scanned/image-based PDFs. Pages without extractable text are read automatically via OCR.",
  },
  {
    q: "Are the answers actually grounded in my document?",
    a: "Yes. Every answer shows the exact source document and page number it came from, and the assistant will tell you explicitly when something isn't in your uploaded documents.",
  },
  {
    q: "Do I need my own Gemini API key?",
    a: "Yes, currently you bring your own free Google API key — it's entered once in the sidebar and stored only in your browser.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Yes, manage or cancel anytime from the Billing Portal in your account sidebar — no questions asked.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="border-b border-white/10 py-5 text-left">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4">
        <span className="font-semibold text-white">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }} className="text-emerald-400">
          +
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="mt-3 text-sm leading-relaxed text-white/50">{a}</p>
      </motion.div>
    </div>
  )
}

export function Faq() {
  return (
    <section id="faq" className="px-6 py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">FAQ</p>
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Questions, answered.</h2>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-14 max-w-2xl"
      >
        {FAQS.map((item) => (
          <FaqItem key={item.q} {...item} />
        ))}
      </motion.div>
    </section>
  )
}
