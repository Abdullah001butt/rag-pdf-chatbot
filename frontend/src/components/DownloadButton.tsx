import { Button } from "@/components/ui/button"
import { downloadFile } from "@/lib/export"

interface DownloadButtonProps {
  label: string
  filename: string
  content: string
  mime?: string
}

export function DownloadButton({ label, filename, content, mime = "text/markdown" }: DownloadButtonProps) {
  return (
    <Button variant="outline" onClick={() => downloadFile(filename, content, mime)}>
      ⬇ {label}
    </Button>
  )
}
