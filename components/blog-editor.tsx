"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  X, Image as ImageIcon, Type, Loader2, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, Trash2, Send, Plus,
} from "lucide-react"
import { GITHUB_CONFIG, githubApiUrl } from "@/lib/github-config"

/* ============================================================
 * 博客编辑器：块式所见即所得
 * - 文本块：.prose 同款字体/字号/行距（1.85），发布时转 markdown 段落
 * - 图片块：默认居中（.prose img 同款圆角/边距），下方可编辑图注
 *   （发布为 *图：xxx*，渲染样式与现有博客图注一致）
 * - 发布：图片 → public/images/，文章 → content/blog/{slug}.mdx
 * ============================================================ */

type TextBlock = { id: string; kind: "text"; text: string }
type ImageBlock = { id: string; kind: "image"; file: File; previewUrl: string; caption: string }
type Block = TextBlock | ImageBlock

let blockSeq = 0
const newId = (kind: string) => `${kind}-${Date.now().toString(36)}-${blockSeq++}`

const IMAGE_EXT_WHITELIST = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "avif"])

// MDX 安全转义：{ } 是 MDX 表达式插值、< > 可能被解析为 JSX，统一转 HTML 实体
function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[[\]]/g, (c) => (c === "[" ? "\\[" : "\\]"))
}

// 标题 → 拼音 slug（中文转拼音、英文保留，非字母数字折叠为连字符）
async function makeSlug(title: string): Promise<string> {
  const { pinyin } = await import("pinyin-pro")
  const py = pinyin(title, { toneType: "none", type: "string" })
  const base = py
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
  return `${base || "post"}-${Date.now()}`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 本地时间 ISO（含时区偏移），与现有文章 date 格式一致
function localIsoDate(): string {
  const n = new Date()
  const pad = (x: number) => String(x).padStart(2, "0")
  const off = -n.getTimezoneOffset()
  const sign = off >= 0 ? "+" : "-"
  const tz = `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}${tz}`
}

// ── 自适应高度 textarea（字体行距继承 .prose 容器）──
function AutoTextarea(props: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [])
  useEffect(() => { resize() }, [props.value, resize])
  return (
    <textarea
      ref={ref}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      onInput={resize}
      placeholder={props.placeholder}
      autoFocus={props.autoFocus}
      rows={1}
      className="w-full resize-none overflow-hidden border-none bg-transparent p-0 outline-none"
      style={{ fontFamily: "inherit", fontSize: "1rem", lineHeight: 1.85 }}
    />
  )
}

export function BlogEditor() {
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>([{ id: newId("text"), kind: "text", text: "" }])
  const [title, setTitle] = useState("")
  const [categories, setCategories] = useState("")
  const [tags, setTags] = useState("")
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [phase, setPhase] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [publishedSlug, setPublishedSlug] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const reset = useCallback(() => {
    setBlocks((prev) => {
      prev.forEach((b) => { if (b.kind === "image") URL.revokeObjectURL(b.previewUrl) })
      return [{ id: newId("text"), kind: "text", text: "" }]
    })
    setTitle("")
    setCategories("")
    setTags("")
    setStatus("idle")
    setPhase("")
    setErrorMsg("")
    setPublishedSlug("")
  }, [])

  const close = () => {
    if (status === "uploading") return
    setOpen(false)
    reset()
  }

  const updateBlock = (id: string, patch: Partial<Omit<TextBlock, "id" | "kind"> & Omit<ImageBlock, "id" | "kind">>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)))
  }

  const removeBlock = (id: string) => {
    setBlocks((prev) => {
      const b = prev.find((x) => x.id === id)
      if (b?.kind === "image") URL.revokeObjectURL(b.previewUrl)
      return prev.filter((x) => x.id !== id)
    })
  }

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const i = prev.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const addText = () => setBlocks((prev) => [...prev, { id: newId("text"), kind: "text", text: "" }])

  const addImages = (files: FileList | null) => {
    if (!files?.length) return
    const imgs: ImageBlock[] = Array.from(files).map((f) => ({
      id: newId("image"),
      kind: "image" as const,
      file: f,
      previewUrl: URL.createObjectURL(f),
      caption: "",
    }))
    setBlocks((prev) => [...prev, ...imgs])
  }

  // ── 发布 ──
  const handleSubmit = async () => {
    if (!title.trim()) { setErrorMsg("请填写标题"); setStatus("error"); return }
    const hasContent = blocks.some((b) => (b.kind === "text" && b.text.trim()) || b.kind === "image")
    if (!hasContent) { setErrorMsg("请输入正文内容"); setStatus("error"); return }
    if (!GITHUB_CONFIG.token) { setErrorMsg("未配置 GitHub Token"); setStatus("error"); return }

    setStatus("uploading")
    setErrorMsg("")

    try {
      const slug = await makeSlug(title.trim())
      const imageUrl = new Map<string, string>()

      // 1. 上传图片 → public/images/{slug}-{n}.{ext}
      const images = blocks.filter((b): b is ImageBlock => b.kind === "image")
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        setPhase(`上传图片中（${i + 1}/${images.length}）...`)
        const rawExt = (img.file.name.split(".").pop() || "jpg").toLowerCase()
        const ext = IMAGE_EXT_WHITELIST.has(rawExt) ? rawExt : "jpg"
        const name = `${slug}-${i + 1}.${ext}`
        const path = `public/images/${name}`
        const res = await fetch(githubApiUrl(path), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GITHUB_CONFIG.token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            message: `blog: upload image ${name}`,
            content: await fileToBase64(img.file),
            branch: GITHUB_CONFIG.branch,
          }),
        })
        if (!res.ok) throw new Error(`图片上传失败: ${(await res.json()).message}`)
        imageUrl.set(img.id, `/images/${name}`)
      }

      // 2. 组装 markdown 正文（文本块转义 MDX 特殊字符；块内换行为硬换行）
      const parts: string[] = []
      for (const b of blocks) {
        if (b.kind === "text") {
          const t = b.text.replace(/\r/g, "").trim()
          if (t) parts.push(t.split("\n").map(escapeText).join("  \n"))
        } else {
          const url = imageUrl.get(b.id)
          if (!url) continue
          const cap = b.caption.trim()
          const alt = cap ? escapeText(cap) : "image"
          parts.push(`![${alt}](${url})`)
          if (cap) parts.push(`*图：${escapeText(cap)}*`)
        }
      }
      const body = parts.join("\n\n")

      // 3. frontmatter + 正文 → content/blog/{slug}.mdx
      const cats = categories.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
      const tgs = tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
      const fm = [
        "---",
        `title: "${title.trim().replace(/"/g, '\\"')}"`,
        `date: "${localIsoDate()}"`,
        "draft: false",
        ...(cats.length ? ["categories:", ...cats.map((c) => `  - ${c}`)] : []),
        ...(tgs.length ? ["tags:", ...tgs.map((t) => `  - ${t}`)] : []),
        "---",
      ].join("\n")
      const mdxContent = `${fm}\n\n${body}\n`

      setPhase("提交文章中...")
      const res = await fetch(githubApiUrl(`content/blog/${slug}.mdx`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          message: `add blog: ${title.trim()}`,
          content: btoa(unescape(encodeURIComponent(mdxContent))),
          branch: GITHUB_CONFIG.branch,
        }),
      })
      if (!res.ok) throw new Error(`文章提交失败: ${(await res.json()).message}`)

      setPhase("")
      setPublishedSlug(slug)
      setStatus("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "发布失败")
      setStatus("error")
    }
  }

  // ── 收起态：标题行右侧胶囊按钮 ──
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-all duration-300 hover:scale-105"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow)",
          color: "var(--accent)",
        }}
      >
        <Plus size={15} />
        添加博客
      </button>
    )
  }

  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(40,40,50,0.6)" : "rgba(245,245,250,0.8)",
    borderColor: "var(--glass-border)",
    color: "var(--text)",
  }

  const BlockActions = ({ id, index }: { id: string; index: number }) => (
    <div className="absolute -top-2 right-0 z-10 hidden items-center gap-0.5 rounded-full px-1 py-0.5 group-hover:flex"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(8px)" }}>
      <button onClick={() => moveBlock(id, -1)} disabled={index === 0} className="rounded-full p-1 transition-opacity hover:opacity-70 disabled:opacity-25" style={{ color: "var(--text-muted)" }} aria-label="上移">
        <ArrowUp size={13} />
      </button>
      <button onClick={() => moveBlock(id, 1)} disabled={index === blocks.length - 1} className="rounded-full p-1 transition-opacity hover:opacity-70 disabled:opacity-25" style={{ color: "var(--text-muted)" }} aria-label="下移">
        <ArrowDown size={13} />
      </button>
      <button onClick={() => removeBlock(id)} className="rounded-full p-1 transition-opacity hover:opacity-70" style={{ color: "#e05a5a" }} aria-label="删除">
        <Trash2 size={13} />
      </button>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <div
        className="flex max-h-[88vh] w-[min(760px,94vw)] flex-col overflow-hidden rounded-[var(--radius)]"
        style={{
          background: isDark ? "rgba(28,28,38,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-hover)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部：标题 + 右上角发布 */}
        <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>添加博客</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={status === "uploading"}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {status === "uploading" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {status === "uploading" ? "发布中..." : "发布"}
            </button>
            <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }} aria-label="关闭">
              <X size={20} />
            </button>
          </div>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>文章已推送到 GitHub！</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              部署完成后即可访问（通常 1~2 分钟）
              {publishedSlug && (
                <> · <a className="underline" style={{ color: "var(--accent)" }} href={`/blog/${publishedSlug}`}>/blog/{publishedSlug}</a></>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* 文章信息 */}
            <div className="grid shrink-0 grid-cols-1 gap-3 px-6 pb-4 md:grid-cols-[1fr_1fr_1fr]">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="标题 *"
                className="col-span-1 rounded-[var(--radius-xs)] border px-3 py-2 text-sm font-medium outline-none transition-colors md:col-span-3"
                style={inputStyle}
              />
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="分类（多个用逗号分隔）"
                className="rounded-[var(--radius-xs)] border px-3 py-2 text-sm outline-none transition-colors"
                style={inputStyle}
              />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签（多个用逗号分隔）"
                className="rounded-[var(--radius-xs)] border px-3 py-2 text-sm outline-none transition-colors md:col-span-2"
                style={inputStyle}
              />
            </div>

            {/* 编辑区（.prose 同款排版） */}
            <div className="prose max-w-none flex-1 overflow-y-auto border-t px-6 py-5" style={{ borderColor: "var(--glass-border)" }}>
              {blocks.map((b, i) => (
                <div key={b.id} className="group relative mb-5">
                  {b.kind === "text" ? (
                    <>
                      <BlockActions id={b.id} index={i} />
                      <AutoTextarea
                        value={b.text}
                        onChange={(v) => updateBlock(b.id, { text: v })}
                        placeholder="写点什么..."
                        autoFocus={blocks.length > 1 && i === blocks.length - 1 && b.text === ""}
                      />
                    </>
                  ) : (
                    <div>
                      <BlockActions id={b.id} index={i} />
                      {/* 图片默认居中（.prose img 同款） */}
                      <img src={b.previewUrl} alt={b.caption || b.file.name} className="mx-auto block max-h-[400px] w-auto max-w-full rounded-[var(--radius-sm)]" />
                      {/* 图注（.prose 图注同款：居中 0.85rem 灰字） */}
                      <input
                        type="text"
                        value={b.caption}
                        onChange={(e) => updateBlock(b.id, { caption: e.target.value })}
                        placeholder="图：图片标注（可留空）"
                        className="mt-1.5 w-full border-none bg-transparent text-center text-[0.85rem] outline-none placeholder:opacity-60"
                        style={{ fontFamily: "inherit", color: "var(--text-muted)" }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* 添加块 */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={addText}
                  className="flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs transition-colors hover:border-[var(--accent)]"
                  style={{ borderColor: "var(--glass-border)", color: "var(--text-muted)" }}
                >
                  <Type size={13} /> 文本
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs transition-colors hover:border-[var(--accent)]"
                  style={{ borderColor: "var(--glass-border)", color: "var(--text-muted)" }}
                >
                  <ImageIcon size={13} /> 图片（默认居中）
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => { addImages(e.target.files); e.target.value = "" }}
                className="hidden"
              />
            </div>

            {/* 底部状态条 */}
            <div className="shrink-0 border-t px-6 py-3" style={{ borderColor: "var(--glass-border)" }}>
              {status === "error" && errorMsg ? (
                <div className="flex items-start gap-2 rounded-[var(--radius-xs)] p-2.5" style={{ background: "rgba(220,80,80,0.08)" }}>
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="text-xs text-red-600">{errorMsg}</span>
                </div>
              ) : status === "uploading" ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={13} className="animate-spin" /> {phase}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  发布后自动推送到 GitHub，Actions 部署完成后生效
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
