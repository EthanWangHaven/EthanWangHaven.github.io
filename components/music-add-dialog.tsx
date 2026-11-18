"use client"

import { useState, useRef, useEffect } from "react"
import { X, Loader2, CheckCircle2, AlertCircle, Upload, Link2, FileAudio, Plus, CircleAlert, ArrowLeft, KeyRound, ShieldCheck, Trash2 } from "lucide-react"
import type { LyricLine, Song } from "@/lib/music-config"
import { resolveNeteaseSong, downloadAudio, addSongToRepo, extractSongId, searchLyrics, fetchLyricsById } from "@/lib/music-repo"
import { getTokenStatus, validateGithubToken, setCustomToken, clearCustomToken, type TokenStatus } from "@/lib/github-config"

/* ============================================================
 * 添加音乐弹窗
 * 两种模式：
 *  - 音乐 id：解析网易云 id → 自动填充歌名/歌手并下载音源入库
 *  - 上传音源文件：手动填写信息并上传本地音频
 * 提交后写入 GitHub 仓库并触发 Actions 自动部署
 * ============================================================ */

type Mode = "id" | "file"
type Phase = "idle" | "resolving" | "uploading" | "success"
type View = "add" | "token"

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
  const [matchedLyrics, setMatchedLyrics] = useState<number | null>(null)
  const [view, setView] = useState<View>("add")
  const [tokenInfo, setTokenInfo] = useState<TokenStatus>({ source: "none", masked: "" })
  const [tokenInput, setTokenInput] = useState("")
  const [tokenBusy, setTokenBusy] = useState(false)
  const [tokenMsg, setTokenMsg] = useState("")
  const [tokenErr, setTokenErr] = useState("")
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

  const busy = phase === "resolving" || phase === "uploading" || tokenBusy
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
    setMatchedLyrics(null)
    setView("add")
    setTokenInput("")
    setTokenMsg("")
    setTokenErr("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const requestClose = () => {
    if (busy) return
    onClose()
    reset()
  }

  const handleSaveToken = async () => {
    const t = tokenInput.trim()
    if (!t) {
      setTokenErr("请先粘贴 GitHub Token")
      return
    }
    setTokenBusy(true)
    setTokenErr("")
    setTokenMsg("")
    try {
      const info = await validateGithubToken(t)
      setCustomToken(t)
      setTokenInfo(getTokenStatus())
      setTokenInput("")
      setTokenMsg(info.login ? `校验通过，已保存 @${info.login} 的 Token` : "校验通过，Token 已保存")
    } catch (e) {
      setTokenErr(e instanceof Error ? e.message : "校验失败")
    } finally {
      setTokenBusy(false)
    }
  }

  const handleClearToken = () => {
    clearCustomToken()
    const next = getTokenStatus()
    setTokenInfo(next)
    setTokenInput("")
    setTokenErr("")
    setTokenMsg(
      next.source === "builtin"
        ? "已清除自定义 Token，继续使用编译内置 Token"
        : "已清除自定义 Token，当前没有可用的 Token"
    )
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
        id = extractSongId(neteaseId)
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

      // 自动匹配歌词：id 模式直接取该 id 的歌词；上传模式按歌名+歌手检索（失败不阻塞提交）
      let lyrics: LyricLine[] = []
      setPhaseText("匹配歌词中...")
      try {
        lyrics = mode === "id" ? await fetchLyricsById(id) : await searchLyrics(title.trim(), artist.trim())
      } catch {}
      setMatchedLyrics(lyrics.length)

      setPhaseText("提交到 GitHub 中...")
      const song = await addSongToRepo({
        id,
        title: title.trim(),
        artist: artist.trim(),
        audio,
        ext,
        lyrics,
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
          <div className="flex items-center gap-2">
            {view === "token" && (
              <button
                onClick={() => { if (!tokenBusy) setView("add") }}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                style={{ color: "var(--m-text-muted)" }}
                aria-label="返回"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-bold">{view === "add" ? "添加音乐" : "Token 设置"}</h2>
            {view === "add" && (
              <button
                onClick={() => { setTokenErr(""); setTokenMsg(""); setTokenInfo(getTokenStatus()); setView("token") }}
                className="flex h-6 w-6 items-center justify-center rounded-full border transition-all hover:scale-105"
                style={{ borderColor: "var(--glass-border)", color: "var(--m-text-muted)" }}
                aria-label="Token 设置"
                title="GitHub Token 设置"
              >
                <CircleAlert size={13} />
              </button>
            )}
          </div>
          <button
            onClick={requestClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ color: "var(--m-text-muted)" }}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {view === "token" ? (
          <div key="token" className="space-y-4">
            {/* 当前 token 状态 */}
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: "var(--glass-border)",
                background: isDark ? "rgba(40,40,50,0.45)" : "rgba(245,245,250,0.6)",
              }}
            >
              <div className="flex items-center gap-2">
                <KeyRound size={14} style={{ color: "var(--m-accent)" }} />
                <span className="text-xs font-medium">
                  {tokenInfo.source === "custom"
                    ? "使用自定义 Token"
                    : tokenInfo.source === "builtin"
                      ? "未设置自定义 Token，使用编译内置 Token"
                      : "未配置 Token，上传不可用"}
                </span>
              </div>
              {tokenInfo.source === "custom" && (
                <p className="mt-1 pl-6 font-mono text-xs" style={{ color: "var(--m-text-muted)" }}>{tokenInfo.masked}</p>
              )}
            </div>

            {/* 输入新 token */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--m-text-light)" }}>新的 GitHub Token</label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => { setTokenInput(e.target.value); setTokenErr(""); setTokenMsg("") }}
                onKeyDown={(e) => { if (e.key === "Enter" && !tokenBusy) handleSaveToken() }}
                placeholder="ghp_… 或 github_pat_…"
                disabled={tokenBusy}
                className="w-full rounded-xl border px-3 py-2 font-mono text-sm outline-none transition-colors disabled:opacity-60"
                style={inputStyle}
              />
              <p className="mt-1.5 text-[0.7rem] leading-relaxed" style={{ color: "var(--m-text-muted)" }}>
                只保存在当前浏览器，不会提交到仓库。建议用 fine-grained token，仅授权本仓库 Contents: Read and write。
              </p>
            </div>

            {tokenMsg && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(176,149,238,0.1)" }}>
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: "var(--m-accent)" }} />
                <span className="text-xs" style={{ color: "var(--m-text-light)" }}>{tokenMsg}</span>
              </div>
            )}

            {tokenErr && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(220,80,80,0.08)" }}>
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <span className="text-xs text-red-600">{tokenErr}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSaveToken}
                disabled={tokenBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-60"
                style={{ background: "var(--m-accent)", color: "white" }}
              >
                {tokenBusy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {tokenBusy ? "校验中..." : "校验并保存"}
              </button>
              {tokenInfo.source === "custom" && (
                <button
                  onClick={handleClearToken}
                  disabled={tokenBusy}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm transition-colors hover:opacity-80 disabled:opacity-60"
                  style={{ borderColor: "var(--glass-border)", color: "var(--m-text-light)" }}
                >
                  <Trash2 size={14} />
                  清除
                </button>
              )}
            </div>

            <p className="text-center text-[0.7rem]" style={{ color: "var(--m-text-muted)" }}>
              Token 过期后在这里粘贴新的即可，无需重新构建部署
            </p>
          </div>
        ) : phase === "success" ? (
          <div key="success" className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="text-sm font-medium">已提交到仓库</p>
            <p className="text-xs" style={{ color: "var(--m-text-muted)" }}>
              {matchedLyrics && matchedLyrics > 0
                ? `已自动匹配 ${matchedLyrics} 行歌词`
                : "未匹配到歌词，可后续手动补充"}
            </p>
            <p className="text-xs" style={{ color: "var(--m-text-muted)" }}>
              GitHub Actions 部署完成后即可播放（约 1-2 分钟）
            </p>
          </div>
        ) : (
          <div key="add" className="space-y-4">
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
