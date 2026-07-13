import { motion } from "framer-motion"
import { Typewriter } from "@/components/landing/Typewriter"

const TABS = ["Chat", "Summaries", "Study Notes", "Quiz", "Flashcards", "Compare", "Research", "Editor"]
const TYPED_WORDS = ["trust.", "verify.", "cite.", "act on."]

export function ProductPreview() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">See it in action</p>
        <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Answers you can{" "}
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            <Typewriter words={TYPED_WORDS} cursorClassName="bg-emerald-400" />
          </span>
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

        <div className="overflow-hidden rounded-2xl border border-border bg-surface font-sans shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-border bg-white/[0.03] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
            <span className="ml-3 rounded-md bg-white/5 px-3 py-1 text-xs text-text-muted">documindai.online/dashboard</span>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="hidden w-56 shrink-0 flex-col gap-4 border-r border-border bg-black/40 p-4 md:flex">
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">Account</div>
                <div className="rounded-xl border border-border bg-white/[0.03] p-3">
                  <div className="mb-1.5 text-sm font-bold text-text">Butt2009</div>
                  <span className="inline-block rounded-full border border-transparent bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                    Pro Plan
                  </span>
                </div>
                <div className="mt-2 w-full rounded-lg bg-accent px-3 py-1.5 text-center text-xs font-semibold text-black">
                  Manage Billing
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">Documents</div>
                <div className="w-full rounded-lg border border-border py-1.5 text-center text-xs text-text-muted">Upload PDFs</div>
                <div className="mt-2 truncate rounded-lg border border-border bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-text-muted">
                  📄 Final_Year_Project_Proposal.pdf
                </div>
              </div>
            </div>

            {/* Main panel */}
            <div className="flex-1 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-sm">📄</div>
                <p className="text-xs text-text-muted">Ask questions across multiple documents, powered by Gemini &amp; retrieval-augmented search</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5 border-b border-border pb-3 text-xs">
                {TABS.map((t, i) => (
                  <span
                    key={t}
                    className={
                      i === 0
                        ? "rounded-md bg-accent/15 px-2.5 py-1 font-semibold text-accent"
                        : "rounded-md px-2.5 py-1 text-text-muted"
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mb-4 flex gap-2">
                <div className="flex-1 rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-xs text-text-muted">
                  Ask a question from your PDF files...
                </div>
                <div className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black">Ask</div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 rounded-xl border border-border bg-white/[0.02] px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-black">U</span>
                  <p className="text-xs text-text">What are the key deliverables and their deadlines?</p>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-border bg-white/[0.02] px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-text">AI</span>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs leading-relaxed text-text">
                      The proposal outlines three deliverables: a working prototype by Week 8, the final report by
                      Week 14, and the live demo presentation in Week 15.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-[10px] text-text-muted">
                        Final_Year_Project_Proposal.pdf · p.3
                      </span>
                      <span className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-[10px] text-text-muted">
                        Final_Year_Project_Proposal.pdf · p.7
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
