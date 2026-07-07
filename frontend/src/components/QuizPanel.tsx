import * as React from "react"
import { api, type QuizQuestion } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"
import { DownloadButton } from "@/components/DownloadButton"
import { buildQuizMarkdown } from "@/lib/export"

interface QuizPanelProps {
  files: string[]
  locked: boolean
}

export function QuizPanel({ files, locked }: QuizPanelProps) {
  const [source, setSource] = React.useState(files[0] || "")
  const [numQuestions, setNumQuestions] = React.useState(5)
  const [quiz, setQuiz] = React.useState<QuizQuestion[] | null>(null)
  const [answers, setAnswers] = React.useState<Record<number, string>>({})
  const [submitted, setSubmitted] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!source && files.length > 0) setSource(files[0])
  }, [files, source])

  if (locked) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm text-text">
        🔒 <strong>Quiz & MCQ Generator</strong> is available on the Pro plan. Upgrade from the sidebar to unlock it.
      </div>
    )
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">Upload at least one PDF in the sidebar first.</p>
  }

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    setQuiz(null)
    setAnswers({})
    setSubmitted(false)
    try {
      const { data } = await api.post(`/generate/quiz?num_questions=${numQuestions}`, { source })
      setQuiz(data.result)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't generate the quiz. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const score = quiz ? quiz.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0) : 0

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Quiz & MCQ Generator</h2>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={busy}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        >
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={3}
          max={15}
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
          disabled={busy}
          className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        />
        <Button onClick={handleGenerate} disabled={busy} className="shrink-0">
          {busy ? "Generating..." : "Generate Quiz"}
        </Button>
      </div>

      {busy && <LoadingState label="Generating quiz questions from your document..." />}
      {error && <p className="text-sm text-danger">{error}</p>}

      {quiz && (
        <div className="flex flex-col gap-4">
          {quiz.map((q, i) => {
            const picked = answers[i]
            return (
              <div key={i} className="rounded-2xl border border-border bg-white/5 p-4">
                <p className="mb-3 font-semibold text-text">
                  Q{i + 1}. {q.question}
                </p>
                <div className="flex flex-col gap-2">
                  {Object.entries(q.options).map(([key, label]) => {
                    const isPicked = picked === key
                    const isCorrect = submitted && key === q.correct
                    const isWrongPick = submitted && isPicked && key !== q.correct
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          isCorrect
                            ? "border-success/40 bg-success/10 text-success"
                            : isWrongPick
                            ? "border-danger/40 bg-danger/10 text-danger"
                            : isPicked
                            ? "border-accent/50 bg-accent/10 text-text"
                            : "border-border text-text hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-q-${i}`}
                          className="accent-accent"
                          checked={isPicked}
                          disabled={submitted}
                          onChange={() => setAnswers((prev) => ({ ...prev, [i]: key }))}
                        />
                        <span>
                          <strong>{key}.</strong> {label}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {submitted && (
                  <p className="mt-2 text-xs text-text-muted">
                    {picked === q.correct ? "✓ Correct" : `✗ Correct answer: ${q.correct}`} — {q.explanation}
                  </p>
                )}
              </div>
            )
          })}

          <div className="flex flex-wrap items-center gap-3">
            {!submitted ? (
              <Button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length !== quiz.length}>
                Check Answers
              </Button>
            ) : (
              <p className="text-sm font-semibold text-text">
                Score: {score} / {quiz.length}
              </p>
            )}
            <DownloadButton
              label="Download Quiz (.md)"
              filename={`${source.replace(/\.[^/.]+$/, "")}_quiz.md`}
              content={buildQuizMarkdown(source, quiz)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
