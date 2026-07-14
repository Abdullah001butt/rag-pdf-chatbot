import * as React from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/ui/icon"
import { CardListSkeleton } from "@/components/ui/skeleton"

interface Workspace {
  id: number
  name: string
  owner_id: number
  role: "owner" | "member"
  member_count: number
  created_at: string
}

interface Member {
  user_id: number
  username: string
  role: "owner" | "member"
  joined_at: string
}

interface WorkspaceDoc {
  id: number
  filename: string
  size_bytes: number
  uploaded_by: string
  created_at: string
}

interface ChatTurn {
  question: string
  answer: string
  citations: string[]
  askedBy: string
}

export function WorkspacesPanel() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const isPro = user?.tier === "pro"

  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newName, setNewName] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const [selectedId, setSelectedId] = React.useState<number | null>(null)
  const [members, setMembers] = React.useState<Member[]>([])
  const [docs, setDocs] = React.useState<WorkspaceDoc[]>([])
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [inviteUsername, setInviteUsername] = React.useState("")
  const [inviting, setInviting] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [menuOpenDocId, setMenuOpenDocId] = React.useState<number | null>(null)
  const [generating, setGenerating] = React.useState(false)
  const [resultOpen, setResultOpen] = React.useState(false)
  const [resultTitle, setResultTitle] = React.useState("")
  const [resultText, setResultText] = React.useState("")

  const [chatTurns, setChatTurns] = React.useState<ChatTurn[]>([])
  const [chatQuestion, setChatQuestion] = React.useState("")
  const [chatBusy, setChatBusy] = React.useState(false)

  const selected = workspaces.find((w) => w.id === selectedId) || null

  React.useEffect(() => {
    if (isPro) loadWorkspaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro])

  React.useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function loadWorkspaces() {
    setLoading(true)
    try {
      const { data } = await api.get("/workspaces")
      setWorkspaces(data.workspaces || [])
      if (data.workspaces?.length && !selectedId) setSelectedId(data.workspaces[0].id)
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't load workspaces.", "error")
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(workspaceId: number) {
    setDetailLoading(true)
    try {
      const [membersRes, docsRes, chatRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/members`),
        api.get(`/workspaces/${workspaceId}/documents`),
        api.get(`/workspaces/${workspaceId}/chat/history`),
      ])
      setMembers(membersRes.data.members || [])
      setDocs(docsRes.data.documents || [])
      setChatTurns(
        (chatRes.data || []).map((row: any) => ({
          question: row.question,
          answer: row.answer,
          citations: row.citations || [],
          askedBy: row.asked_by,
        }))
      )
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't load workspace details.", "error")
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleChatAsk(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !chatQuestion.trim()) return
    setChatBusy(true)
    const q = chatQuestion
    setChatQuestion("")
    try {
      const { data } = await api.post(`/workspaces/${selected.id}/chat/ask`, { question: q })
      setChatTurns((prev) => [
        ...prev,
        { question: q, answer: data.answer, citations: data.citations || [], askedBy: user?.username || "" },
      ])
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Something went wrong.", "error")
    } finally {
      setChatBusy(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post("/workspaces", { name: newName.trim() })
      setWorkspaces((prev) => [data, ...prev])
      setSelectedId(data.id)
      setNewName("")
      toast(`Workspace "${data.name}" created.`, "success")
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't create the workspace.", "error")
    } finally {
      setCreating(false)
    }
  }

  async function handleInvite() {
    if (!selected || !inviteUsername.trim()) return
    setInviting(true)
    try {
      const { data } = await api.post(`/workspaces/${selected.id}/invite`, { username: inviteUsername.trim() })
      toast(`${data.username} added to the workspace.`, "success")
      setInviteUsername("")
      loadDetail(selected.id)
      setWorkspaces((prev) => prev.map((w) => (w.id === selected.id ? { ...w, member_count: w.member_count + 1 } : w)))
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't invite that user.", "error")
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(targetUserId: number) {
    if (!selected) return
    try {
      await api.delete(`/workspaces/${selected.id}/members/${targetUserId}`)
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId))
      toast("Member removed.", "success")
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't remove that member.", "error")
    }
  }

  async function handleDeleteWorkspace() {
    if (!selected) return
    try {
      await api.delete(`/workspaces/${selected.id}`)
      setWorkspaces((prev) => prev.filter((w) => w.id !== selected.id))
      setSelectedId(null)
      toast("Workspace deleted.", "success")
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't delete the workspace.", "error")
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files
    if (!selected || !selectedFiles || selectedFiles.length === 0) return
    setUploading(true)
    const formData = new FormData()
    Array.from(selectedFiles).forEach((f) => formData.append("files", f))
    try {
      await api.post(`/workspaces/${selected.id}/documents/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast("Document uploaded.", "success")
      loadDetail(selected.id)
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Upload failed.", "error")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDownload(doc: WorkspaceDoc) {
    if (!selected) return
    try {
      const res = await api.get(`/workspaces/${selected.id}/documents/${doc.id}/download`, { responseType: "blob" })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't download this document.", "error")
    }
  }

  async function handleDeleteDoc(docId: number) {
    if (!selected) return
    try {
      await api.delete(`/workspaces/${selected.id}/documents/${docId}`)
      setDocs((prev) => prev.filter((d) => d.id !== docId))
      toast("Document removed.", "success")
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Couldn't remove this document.", "error")
    }
  }

  async function handleGenerate(doc: WorkspaceDoc, action: "summary" | "notes" | "quiz" | "flashcards") {
    if (!selected) return
    setMenuOpenDocId(null)
    setGenerating(true)
    try {
      const { data } = await api.post(`/workspaces/${selected.id}/documents/${doc.id}/generate/${action}`)
      let text = ""
      if (action === "summary" || action === "notes") {
        text = data.result
      } else if (action === "quiz") {
        text = data.result
          .map((q: any, i: number) => `Q${i + 1}. ${q.question}\nAnswer: ${q.correct} — ${q.explanation}`)
          .join("\n\n")
      } else {
        text = data.result.map((c: any, i: number) => `${i + 1}. Q: ${c.question}\n   A: ${c.answer}`).join("\n\n")
      }
      setResultTitle(`${t(`dash.tab.${action}`)} — ${doc.filename}`)
      setResultText(text)
      setResultOpen(true)
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Generation failed.", "error")
    } finally {
      setGenerating(false)
    }
  }

  if (!isPro) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-8 text-center">
        <Icon name="groups" size={28} className="text-warning" />
        <h2 className="text-base font-semibold text-text">{t("workspaces.lockedTitle")}</h2>
        <p className="max-w-sm text-sm text-text-muted">{t("workspaces.lockedBody")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <Icon name="groups" size={19} filled />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-text">{t("workspaces.title")}</h2>
            <p className="text-xs text-text-muted">{t("workspaces.description")}</p>
          </div>
        </div>

        <div className="card-surface flex gap-2 rounded-xl p-3">
          <Input placeholder={t("workspaces.namePlaceholder")} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="shrink-0">
            <Icon name="add" size={17} />
          </Button>
        </div>

        {loading && <CardListSkeleton count={2} />}
        {!loading && workspaces.length === 0 && (
          <p className="text-sm text-text-muted">{t("workspaces.none")}</p>
        )}
        <div className="flex flex-col gap-1.5">
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                selectedId === w.id
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-white/10 bg-white/3 text-text hover:bg-white/5"
              }`}
            >
              <span className="min-w-0 truncate font-medium">{w.name}</span>
              <span className="shrink-0 text-xs text-text-muted">{w.member_count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {!selected && (
          <p className="text-sm text-text-muted">{t("workspaces.selectPrompt")}</p>
        )}
        {selected && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-text">{selected.name}</h3>
              {selected.role === "owner" && (
                <button
                  onClick={handleDeleteWorkspace}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs text-danger"
                >
                  <Icon name="delete" size={14} />
                  {t("workspaces.deleteWorkspace")}
                </button>
              )}
            </div>

            {detailLoading && <CardListSkeleton count={2} />}

            {!detailLoading && (
              <>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-text">{t("workspaces.members")}</h4>
                  {selected.role === "owner" && (
                    <div className="mb-3 flex gap-2">
                      <Input
                        placeholder={t("workspaces.inviteUsernamePlaceholder")}
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                      />
                      <Button onClick={handleInvite} disabled={inviting || !inviteUsername.trim()} className="shrink-0">
                        <Icon name="person_add" size={17} />
                        {t("workspaces.invite")}
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {members.map((m) => (
                      <div
                        key={m.user_id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2 text-text">
                          <Icon name={m.role === "owner" ? "star" : "person"} size={15} className="text-text-muted" filled={m.role === "owner"} />
                          {m.username}
                        </span>
                        {selected.role === "owner" && m.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-danger"
                          >
                            <Icon name="person_remove" size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-text">{t("workspaces.documents")}</h4>
                    <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleUpload} className="hidden" id="workspace-upload" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Icon name="upload_file" size={16} />
                      {uploading ? t("sidebar.uploading") : t("sidebar.uploadPdfs")}
                    </Button>
                  </div>
                  {docs.length === 0 && <p className="text-sm text-text-muted">{t("workspaces.noDocuments")}</p>}
                  <div className="flex flex-col gap-1.5">
                    {docs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 text-text">
                          <Icon name="picture_as_pdf" size={15} className="shrink-0 text-danger/80" />
                          <span className="truncate">{d.filename}</span>
                          <span className="shrink-0 text-xs text-text-muted">· {d.uploaded_by}</span>
                        </span>
                        <span className="relative flex shrink-0 gap-1.5">
                          <button
                            onClick={() => setMenuOpenDocId(menuOpenDocId === d.id ? null : d.id)}
                            disabled={generating}
                            className="flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-accent disabled:opacity-50"
                          >
                            <Icon name="auto_awesome" size={13} />
                          </button>
                          {menuOpenDocId === d.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-white/10 bg-surface-2 py-1 shadow-xl">
                              {(["summary", "notes", "quiz", "flashcards"] as const).map((action) => (
                                <button
                                  key={action}
                                  onClick={() => handleGenerate(d, action)}
                                  className="block w-full px-3 py-1.5 text-left text-xs text-text hover:bg-white/5"
                                >
                                  {t(`dash.tab.${action}`)}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => handleDownload(d)}
                            className="rounded-md border border-border px-2 py-1 text-text-muted"
                          >
                            <Icon name="download" size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(d.id)}
                            className="rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-danger"
                          >
                            <Icon name="delete" size={13} />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text">
                    <Icon name="forum" size={16} />
                    {t("workspaces.teamChat")}
                  </h4>
                  <form onSubmit={handleChatAsk} className="mb-3 flex gap-2">
                    <Input
                      placeholder={t("chat.placeholder")}
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      disabled={chatBusy}
                    />
                    <Button type="submit" disabled={chatBusy || !chatQuestion.trim()} className="shrink-0">
                      {chatBusy ? t("chat.thinking") : t("chat.ask")}
                    </Button>
                  </form>
                  <div className="flex flex-col gap-3">
                    {[...chatTurns].reverse().map((turn, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="flex gap-2 rounded-xl border border-white/10 bg-accent/10 px-3 py-2 text-sm">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-bold text-white">
                            {turn.askedBy.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-text">{turn.question}</p>
                            <p className="text-xs text-text-muted">{turn.askedBy}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-sm">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#2a2f3d] text-[11px] font-bold text-white">
                            AI
                          </span>
                          <div className="min-w-0">
                            <p className="whitespace-pre-wrap text-text">{turn.answer}</p>
                            {turn.citations.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {turn.citations.map((c, ci) => (
                                  <span key={ci} className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-text-muted">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {chatTurns.length === 0 && <p className="text-sm text-text-muted">{t("workspaces.noChatYet")}</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {resultOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setResultOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-text">{resultTitle}</h3>
              <button onClick={() => setResultOpen(false)} className="shrink-0 rounded-full p-1 text-text-muted hover:bg-white/10 hover:text-text">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto whitespace-pre-wrap text-sm text-text-muted">
              {resultText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
