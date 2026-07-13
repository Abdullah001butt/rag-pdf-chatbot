import * as React from "react"
import { api, type Flashcard } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/Spinner"
import { DownloadButton } from "@/components/DownloadButton"
import { buildFlashcardsCsv } from "@/lib/export"

interface FlashcardsPanelProps {
  files: string[]
  locked: boolean
}

export function FlashcardsPanel({ files, locked }: FlashcardsPanelProps) {
  const { t } = useLanguage()
  const [source, setSource] = React.useState(files[0] || "")
  const [numCards, setNumCards] = React.useState(10)
  const [cards, setCards] = React.useState<Flashcard[] | null>(null)
  const [index, setIndex] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!source && files.length > 0) setSource(files[0])
  }, [files, source])

  if (locked) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm text-text">
        {t("flashcards.locked")}
      </div>
    )
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">{t("common.uploadFirst")}</p>
  }

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    setCards(null)
    setIndex(0)
    setFlipped(false)
    try {
      const { data } = await api.post(`/generate/flashcards?num_cards=${numCards}`, { source })
      setCards(data.result)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't generate flashcards. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const card = cards ? cards[index] : null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("flashcards.title")}</h2>

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
          min={5}
          max={25}
          value={numCards}
          onChange={(e) => setNumCards(Number(e.target.value))}
          disabled={busy}
          className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        />
        <Button onClick={handleGenerate} disabled={busy} className="shrink-0">
          {busy ? t("flashcards.generating") : t("flashcards.generate")}
        </Button>
      </div>

      {busy && <LoadingState label={t("flashcards.generating")} />}
      {error && <p className="text-sm text-danger">{error}</p>}

      {card && cards && (
        <div className="flex flex-col gap-3">
          <div className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
            {flipped ? t("flashcards.answer") : t("flashcards.question")} · {t("flashcards.card")} {index + 1}/{cards.length}
          </div>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[160px] cursor-pointer items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-accent/10 to-accent/2 p-6 text-center text-base text-text transition-transform hover:scale-[1.01]"
          >
            {flipped ? card.back : card.front}
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => {
                setIndex((i) => i - 1)
                setFlipped(false)
              }}
            >
              {t("flashcards.previous")}
            </Button>
            <Button variant="outline" onClick={() => setFlipped((f) => !f)}>
              {t("flashcards.flipBtn")}
            </Button>
            <Button
              variant="outline"
              disabled={index === cards.length - 1}
              onClick={() => {
                setIndex((i) => i + 1)
                setFlipped(false)
              }}
            >
              {t("flashcards.next")}
            </Button>
          </div>
          <div className="flex justify-center">
            <DownloadButton
              label={t("flashcards.download")}
              filename={`${source.replace(/\.[^/.]+$/, "")}_flashcards.csv`}
              content={buildFlashcardsCsv(cards)}
              mime="text/csv"
            />
          </div>
        </div>
      )}
    </div>
  )
}
