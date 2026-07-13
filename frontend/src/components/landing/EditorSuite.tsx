import { motion } from "framer-motion"

const TOOLS = [
  {
    icon: "✏️",
    title: "Click-to-Edit Text",
    body: "Fix typos, dates, and names directly on the page — no re-export from another tool.",
  },
  {
    icon: "✍️",
    title: "E-Signatures",
    body: "Draw or type a signature, place it anywhere, and it's baked into the exported PDF.",
  },
  {
    icon: "📝",
    title: "Form Filling",
    body: "Fill existing fillable PDFs, or click to add new fillable fields to any flat PDF.",
  },
  {
    icon: "🔍",
    title: "OCR for Scans",
    body: "Scanned, image-only pages become editable text with one click — powered by Gemini vision.",
  },
  {
    icon: "✨",
    title: "AI Rewriting",
    body: "Select any text and fix grammar, or shift the tone formal or casual, instantly.",
  },
  {
    icon: "🛡️",
    title: "PII Auto-Redact",
    body: "Scan a page for emails, phone numbers, SSNs, and card numbers, then redact them in one click.",
  },
]

export function EditorSuite() {
  return (
    <section id="editor" className="border-y border-white/10 bg-white/[0.015] px-6 py-28 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">PDF Editor Suite</p>
      <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Don't just read it. Edit it.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/50">
        A full editor built into your document workflow — no separate app, no re-uploading.
      </p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-lg">
              {tool.icon}
            </div>
            <h3 className="mb-2 text-base font-bold text-white">{tool.title}</h3>
            <p className="text-sm leading-relaxed text-white/50">{tool.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
