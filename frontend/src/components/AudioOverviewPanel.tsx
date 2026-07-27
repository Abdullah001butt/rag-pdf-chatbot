import * as React from "react"
import { api } from "@/lib/api"
import { useLanguage } from "@/context/LanguageContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { CardListSkeleton } from "@/components/ui/skeleton"

interface AudioOverviewPanelProps {
  files: string[]
}

interface ScriptLine {
  speaker: "A" | "B"
  line: string
}

type PlayState = "idle" | "playing" | "paused"

function pickVoices(): { a: SpeechSynthesisVoice | null; b: SpeechSynthesisVoice | null } {
  const voices = window.speechSynthesis?.getVoices() || []
  const english = voices.filter((v) => v.lang.startsWith("en"))
  const pool = english.length >= 2 ? english : voices
  if (pool.length === 0) return { a: null, b: null }
  const female = pool.find((v) => /female|zira|samantha|susan|victoria/i.test(v.name))
  const male = pool.find((v) => /male|david|mark|daniel|alex/i.test(v.name))
  const a = female || pool[0]
  const b = male && male !== a ? male : pool.find((v) => v !== a) || pool[0]
  return { a, b }
}

export function AudioOverviewPanel({ files }: AudioOverviewPanelProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [source, setSource] = React.useState(files[0] || "")
  const [loading, setLoading] = React.useState(false)
  const [script, setScript] = React.useState<ScriptLine[]>([])
  const [playState, setPlayState] = React.useState<PlayState>("idle")
  const [activeIdx, setActiveIdx] = React.useState(-1)
  const voicesRef = React.useRef<{ a: SpeechSynthesisVoice | null; b: SpeechSynthesisVoice | null }>({ a: null, b: null })
  const stopRequestedRef = React.useRef(false)

  React.useEffect(() => {
    if (!source && files.length > 0) setSource(files[0])
  }, [files, source])

  React.useEffect(() => {
    function loadVoices() {
      voicesRef.current = pickVoices()
    }
    loadVoices()
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices)
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices)
  }, [])

  React.useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  async function handleGenerate() {
    if (!source) return
    setLoading(true)
    window.speechSynthesis?.cancel()
    setPlayState("idle")
    setActiveIdx(-1)
    setScript([])
    try {
      const { data } = await api.post("/generate/audio-overview", { source })
      setScript(data.script || [])
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't generate the audio overview.", "error")
    } finally {
      setLoading(false)
    }
  }

  function speakFrom(index: number) {
    if (!window.speechSynthesis || index >= script.length) {
      setPlayState("idle")
      setActiveIdx(-1)
      return
    }
    const turn = script[index]
    const utter = new SpeechSynthesisUtterance(turn.line)
    const voice = turn.speaker === "A" ? voicesRef.current.a : voicesRef.current.b
    if (voice) utter.voice = voice
    utter.pitch = turn.speaker === "A" ? 1.1 : 0.9
    utter.rate = 1.0
    setActiveIdx(index)
    utter.onend = () => {
      if (stopRequestedRef.current) return
      speakFrom(index + 1)
    }
    utter.onerror = () => {
      if (stopRequestedRef.current) return
      speakFrom(index + 1)
    }
    window.speechSynthesis.speak(utter)
  }

  function handlePlay() {
    if (!window.speechSynthesis) {
      toast("Your browser doesn't support speech playback.", "error")
      return
    }
    if (playState === "paused") {
      window.speechSynthesis.resume()
      setPlayState("playing")
      return
    }
    stopRequestedRef.current = false
    setPlayState("playing")
    speakFrom(0)
  }

  function handlePause() {
    window.speechSynthesis?.pause()
    setPlayState("paused")
  }

  function handleStop() {
    stopRequestedRef.current = true
    window.speechSynthesis?.cancel()
    setPlayState("idle")
    setActiveIdx(-1)
  }

  if (files.length === 0) {
    return <p className="text-sm text-text-muted">{t("common.uploadFirst")}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t("audio.title")}</h2>
      <p className="text-xs text-text-muted">{t("audio.description")}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
        >
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <Button onClick={handleGenerate} disabled={loading} className="shrink-0">
          <Icon name="podcasts" size={17} />
          {loading ? t("audio.generating") : t("audio.generate")}
        </Button>
      </div>

      {loading && <CardListSkeleton count={4} />}

      {!loading && script.length > 0 && (
        <>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/3 p-3">
            {playState !== "playing" ? (
              <Button onClick={handlePlay} className="shrink-0">
                <Icon name="play_arrow" size={18} filled />
                {playState === "paused" ? t("audio.resume") : t("audio.play")}
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="shrink-0">
                <Icon name="pause" size={18} filled />
                {t("audio.pause")}
              </Button>
            )}
            <Button onClick={handleStop} variant="outline" disabled={playState === "idle"} className="shrink-0">
              <Icon name="stop" size={18} />
              {t("audio.stop")}
            </Button>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-text-muted">
              <Icon name="info" size={14} />
              {t("audio.browserVoice")}
            </span>
          </div>

          <div className="scrollbar-thin flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {script.map((turn, i) => (
              <div
                key={i}
                className={`flex gap-3 rounded-2xl border p-3 transition-colors ${
                  activeIdx === i
                    ? "border-accent/50 bg-accent/10"
                    : turn.speaker === "A"
                    ? "border-white/10 bg-white/3"
                    : "border-white/10 bg-[#2a2f3d]/40"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                    turn.speaker === "A" ? "bg-accent" : "bg-[#3b4252]"
                  }`}
                >
                  {turn.speaker}
                </span>
                <p className="text-sm text-text">{turn.line}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
