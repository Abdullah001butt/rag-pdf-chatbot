import * as React from "react"

interface TypewriterProps {
  words: string[]
  className?: string
  cursorClassName?: string
  typingSpeedMs?: number
  deletingSpeedMs?: number
  pauseMs?: number
}

export function Typewriter({
  words,
  className,
  cursorClassName = "bg-current",
  typingSpeedMs = 70,
  deletingSpeedMs = 35,
  pauseMs = 1800,
}: TypewriterProps) {
  const [wordIndex, setWordIndex] = React.useState(0)
  const [text, setText] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    const current = words[wordIndex % words.length]

    if (!deleting && text === current) {
      const pause = setTimeout(() => setDeleting(true), pauseMs)
      return () => clearTimeout(pause)
    }

    if (deleting && text === "") {
      setDeleting(false)
      setWordIndex((i) => (i + 1) % words.length)
      return
    }

    const timeout = setTimeout(
      () => {
        setText((prev) => (deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)))
      },
      deleting ? deletingSpeedMs : typingSpeedMs
    )
    return () => clearTimeout(timeout)
  }, [text, deleting, wordIndex, words, typingSpeedMs, deletingSpeedMs, pauseMs])

  return (
    <span className={className}>
      {text}
      <span className={`ml-0.5 inline-block w-0.5 animate-pulse align-middle ${cursorClassName}`} style={{ height: "0.85em" }} />
    </span>
  )
}
