import { useNavigate } from "react-router-dom"

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate("/")} className="mb-8 text-sm font-semibold text-emerald-400 hover:underline">
          ← Back to Documind AI
        </button>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/40">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-white/70">
          <section>
            <h2 className="mb-2 text-lg font-bold text-white">What we collect</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Account info: username, email address, and a bcrypt-hashed password (we never see or store your plain-text password).</li>
              <li>Uploaded PDFs, held in server memory only for your active session — never written to disk or a database.</li>
              <li>Your Google Gemini API key, stored only in your browser's local storage and forwarded directly to Google per-request. We do not store it on our servers.</li>
              <li>Billing information, handled entirely by Stripe — we never receive or store your card details.</li>
              <li>Basic usage data (which actions you take and how often) to enforce plan limits.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">What we don't do</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>We don't sell your data to anyone.</li>
              <li>We don't permanently store your uploaded documents.</li>
              <li>We don't share your documents or chat history with other users.</li>
              <li>We don't use your documents to train any AI model.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">Third-party services we use</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong className="text-white">Google Gemini</strong> — processes your documents and questions to generate AI responses, using your own API key.</li>
              <li><strong className="text-white">Stripe</strong> — processes Pro plan payments and manages your subscription.</li>
              <li><strong className="text-white">Resend</strong> — delivers account emails (verification, password reset).</li>
              <li><strong className="text-white">Render &amp; Vercel</strong> — host our backend, database, and frontend.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">Data retention</h2>
            <p>
              Account data (username, email, hashed password, usage history) is kept until you delete your account
              from Account Settings, at which point it's permanently removed. Uploaded documents are cleared when
              your session ends or the server restarts — nothing is retained beyond that. Password reset and email
              verification links expire automatically (1 hour and 24 hours respectively) and are single-use.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">Your rights</h2>
            <p>
              You can delete your account and all associated data at any time from Account Settings. If you have
              questions about your data, contact us at{" "}
              <a href="mailto:support@documindai.online" className="text-emerald-400 hover:underline">
                support@documindai.online
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">Changes to this policy</h2>
            <p>
              We may update this policy as the product evolves. Material changes will be reflected by updating the
              "Last updated" date above.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
