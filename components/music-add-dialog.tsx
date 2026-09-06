"use client"

import { useState, useRef, useEffect } from "react"
import { X, Loader2, CheckCircle2, AlertCircle, Upload, Link2, FileAudio, Plus } from "lucide-react"
import type { Song } from "@/lib/music-config"
import { resolveNeteaseSong, downloadAudio, addSongToRepo } from "@/lib/music-repo"

/* ============================================================
 * 添加音乐弹窗
 * 两种模式：
 *  - 音乐 id：解析网易云 id → 自动填充歌名/歌手并下载音源入库
 *  - 上传音源文件：手动填写信息并上传本地音频
 * 提交后写入 GitHub 仓库并触发 Actions 自动部署
 * ============================================================ */

type Mode = "id" | "file"
type Phase = "idle" | "resolving" | "uploading" | "success"

const MAX_AUDIO_SIZE = 60 * 1024 * 1024

interface MusicAddDialogProps {
  open: boolean
  onClose: () => void
  onAdded: (song: Song) => void
}

export function MusicAddDialog({ open, onClose, onAdded }: MusicAddDialogProps) {
  const [isDark, setIsDark] = useState(false)
  const [mode, setMode] = useState<Mode>("id")
  const [neteaseId, setNeteaseId] = useState("")
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [resolved, setResolved] = useState<{ blob: Blob; ext: string } | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [phaseText, setPhaseText] = useState("")
  const [notice, setNotice] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 监听主题变化
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  if (!open) return null

  const busy = phase === "resolving" || phase === "uploading"
  const modalBg = isDark ? "rgba(28, 28, 38, 0.85)" : "rgba(255, 255, 255, 0.85)"

  const reset = () => {
    setMode("id")
    setNeteaseId("")
    setTitle("")
    setArtist("")
    setAudioFile(null)
    setResolved(null)
    setPhase("idle")
    setPhaseText("")
    setNotice("")
    setErrorMsg("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const requestClose = () => {
    if (busy) return
    onClose()
    reset()
  }

  const handleIdChange = (v: string) => {
    setNeteaseId(v)
    if (resolved) {
      setResolved(null)
      setNotice("")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMsg("")
    if (file.size > MAX_AUDIO_SIZE) {
      setErrorMsg("音源文件超过 60MB，超出 GitHub 提交限制")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setAudioFile(file)
  }

  const handleResolve = async () => {
    const id = neteaseId.trim()
    if (!id) {
      setErrorMsg("请先输入音乐 id")
      return
    }
    setErrorMsg("")
    setNotice("")
    setPhase("resolving")
    setPhaseText("解析歌曲信息...")
    try {
      const info = await resolveNeteaseSong(id)
      if (info.title) setTitle(info.title)
      if (info.artist) setArtist(info.artist)
      setPhaseText("下载音源中（可能需要一段时间）...")
      const blob = await downloadAudio(info.audioUrl)
      setResolved({ blob, ext: info.ext })
      setNotice(`解析成功：${info.title} - ${info.artist}，音源已就绪（${(blob.size / 1024 / 1024).toFixed(1)}MB）。可修改信息后添加。`)
      setPhase("idle")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "解析失败")
      setPhase("idle")
    }
  }

  const handleSubmit = async () => {
    setErrorMsg("")
    if (!title.trim() || !artist.trim()) {
      setErrorMsg("请填写音乐名称和歌手名称")
      return
    }
    if (mode === "id" && !resolved) {
      setErrorMsg("请先点击「解析」获取歌曲信息和音源")
      return
    }
    if (mode === "file" && !audioFile) {
      setErrorMsg("请选择音源文件")
      return
    }

    setPhase("uploading")
    setPhaseText("提交到 GitHub 中...")
    try {
      let audio: Blob
      let ext: string
      let id: string
      if (mode === "id") {
        if (!resolved) {
          setErrorMsg("请先点击「解析」获取歌曲信息和音源")
          setPhase("idle")
          return
        }
        audio = resolved.blob
        ext = resolved.ext
        id = neteaseId.trim()
      } else {
        if (!audioFile) {
          setErrorMsg("请选择音源文件")
          setPhase("idle")
          return
        }
        audio = audioFile
        ext = audioFile.name.split(".").pop()?.toLowerCase() || "mp3"
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      }
      const song = await addSongToRepo({
        id,
        title: title.trim(),
        artist: artist.trim(),
        audio,
        ext,
      })
      setPhase("success")
      onAdded(song)
      setTimeout(() => {
        onClose()
        reset()
      }, 2600)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "提交失败")
      setPhase("idle")
    }
  }

  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(40,40,50,0.6)" : "rgba(245,245,250,0.8)",
    borderColor: "var(--glass-border)",
    color: "var(--text)",
  }

  const modePill = (m: Mode, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { if (!busy) { setMode(m); setErrorMsg(""); setNotice("") } }}
      className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
      style={mode === m ? { background: "var(--m-accent)", color: "white" } : { border: "1px solid var(--glass-border)", color: "var(--m-text-light)" }}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose() }}
    >
      <div
        className="w-[min(440px,90vw)] overflow-hidden rounded-3xl p-6"
        style={{
          background: modalBg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">添加音乐</h2>
          <button
            onClick={requestClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ color: "var(--m-text-muted)" }}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {phase === "success" ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="text-sm font-medium">已提交到仓库</p>
            <p className="text-xs" style={{ color: "var(--m-text-muted)" }}>
              GitHub Actions 部署完成后即可播放（约 1-2 分钟）
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 模式切换 */}
            <div className="flex gap-2">
              {modePill("id", "音乐 id 解析", <Link2 size={14} />)}
              {modePill("file", "上传音源文件", <FileAudio size={14} />)}
            </div>

            {mode === "id" ? (
              /* 音乐 id + 解析按钮 */
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--m-text-light)" }}>网易云音乐 ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={neteaseId}
                    onChange={(e) => handleIdChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && phase !== "resolving") handleResolve() }}
                    placeholder="歌曲 id 或完整链接，如 https://music.163.com/song?id=2707652860"
                    disabled={busy}
                    className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition-colors disabled:opacity-60"
                    style={inputStyle}
                  />
                  <button
                    onClick={handleResolve}
                    disabled={busy}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-60"
                    style={{ background: "var(--m-accent)", color: "white" }}
                  >
                    {phase === "resolving" ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    {phase === "resolving" ? phaseText : "解析"}
                  </button>
                </div>
              </div>
            ) : (
              /* 音源文件选择 */
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--m-text-light)" }}>音源文件</label>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed transition-colors hover:opacity-80 disabled:opacity-60"
                  style={{ borderColor: resolved || audioFile ? "var(--m-accent)" : "var(--glass-border)", color: "var(--m-text-muted)" }}
                >
                  <Upload size={20} />
                  <span className="max-w-[90%] truncate text-xs">
                    {audioFile ? `${audioFile.name}（${(audioFile.size / 1024 / 1024).toFixed(1)}MB）` : "点击选择音频文件（mp3 / m4a / flac ...）"}
                  </span>
                </button>
              </div>
            )}

            {/* 音乐名称 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--m-text-light)" }}>音乐名称 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="歌曲名称"
                disabled={busy}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors disabled:opacity-60"
                style={inputStyle}
              />
            </div>

            {/* 歌手名称 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--m-text-light)" }}>歌手名称 *</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="歌手"
                disabled={busy}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors disabled:opacity-60"
                style={inputStyle}
              />
            </div>

            {/* 解析提示 */}
            {notice && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(176,149,238,0.1)" }}>
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: "var(--m-accent)" }} />
                <span className="text-xs" style={{ color: "var(--m-text-light)" }}>{notice}</span>
              </div>
            )}

            {/* 错误信息 */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(220,80,80,0.08)" }}>
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <span className="text-xs text-red-600">{errorMsg}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-60"
              style={{ background: "var(--m-accent)", color: "white" }}
            >
              {phase === "uploading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {phaseText}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  添加到歌单
                </>
              )}
            </button>
            <p className="text-center text-[0.7rem]" style={{ color: "var(--m-text-muted)" }}>
              提交后自动 push 到 GitHub 并触发部署，新歌稍后自动上线
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
