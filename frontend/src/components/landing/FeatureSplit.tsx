import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"

const TYPED_WORDS = ["the facts.", "the source.", "the point.", "the answer."]

const ITEMS = [
  { n: "01", title: "Instant Summary", body: "The point in seconds" },
  { n: "02", title: "Ask Questions", body: "Chat with the document" },
  { n: "03", title: "See Sources", body: "Proof on every answer" },
  { n: "04", title: "Clear Next Steps", body: "Action items & risks" },
]

export function FeatureSplit() {
  return (
    <section className="border-y border-white/10 bg-white/[0.015] px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">What you get</p>
          <h2 className="text-5xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-6xl">
            Fast to
            <br />
            <span className="text-emerald-400">
              <Typewriter words={TYPED_WORDS} cursorClassName="bg-emerald-400" />
            </span>
          </h2>
          <div className="mt-6 h-px w-16 bg-white/20" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-white/40">
            Summary · Q&amp;A · Sources · Action Items
          </p>
        </motion.div>

        <div className="flex flex-col gap-8 border-l border-white/10 pl-8">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-4"
            >
              <span className="text-3xl font-extrabold text-white/10">{item.n}</span>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white">{item.title}</h3>
                <p className="text-sm uppercase tracking-wide text-white/40">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
