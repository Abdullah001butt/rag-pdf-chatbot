import { motion } from "framer-motion"

export function ProductPreview() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">See it in action</p>
        <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Answers you can trust.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/50">
          Every response is grounded in your actual documents, with citations linking back to the exact page.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <div
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-60 blur-3xl"
          style={{ background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(16,185,129,0.25), transparent 70%)" }}
        />

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f14] shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
            <span className="ml-3 rounded-md bg-white/5 px-3 py-1 text-xs text-white/40">app.documind.ai/dashboard</span>
          </div>
          <img src="/product-preview.png" alt="Documind AI chat interface with cited answers" className="w-full" />
        </div>
      </motion.div>
    </section>
  )
}
