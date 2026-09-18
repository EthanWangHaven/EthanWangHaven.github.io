"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle,
  ArrowUpToLine, Send, Plus,
} from "lucide-react"
import { GITHUB_CONFIG, githubApiUrl } from "@/lib/github-config"

/* ============================================================
 * 博客编辑器：Word 式富文本（contenteditable）
 * - 一整个正文区，.prose 同款字体/字号/行距（1.85），回车即分段
 * - 图片插入光标处（默认居中，.prose img 同款），下方自动带可编辑图注
 *   （图注样式复用全局 .prose p:has(>img)+p，发布为 *图：xxx*）
 * - 粘贴/拖拽图片直接插入正文；粘贴文本仅保留纯文本
 * - 发布：图片 → public/images/，正文序列化为 markdown → content/blog/{slug}.mdx
 * ============================================================ */

const INIT_HTML = "<p><br></p>"

type Para =
  | { type: "text"; text: string }
  | { type: "img"; uid: string; caption: string }

let blockSeq = 0
const newUid = () => `img-${Date.now().toString(36)}-${blockSeq++}`

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

export function BlogEditor() {
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [title, setTitle] = useState("")
  const [categories, setCategories] = useState("")
  const [tags, setTags] = useState("")
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [phase, setPhase] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [publishedSlug, setPublishedSlug] = useState("")

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 待上传图片：uid → { file, 本地预览 URL }
  const imgFiles = useRef(new Map<string, { file: File; previewUrl: string }>())

  const initHtml = useMemo(() => ({ __html: INIT_HTML }), [])

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const syncEmpty = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const empty = el.innerText.replace(/\u00a0/g, " ").trim() === "" && !el.querySelector("img")
    el.classList.toggle("editor-empty", empty)
  }, [])

  // 回车生成 <p>（便于序列化）；挂载后同步空内容占位符
  useEffect(() => {
    if (!open) return
    try { document.execCommand("defaultParagraphSeparator", false, "p") } catch {}
    syncEmpty()
  }, [open, syncEmpty])

  const reset = useCallback(() => {
    imgFiles.current.forEach((rec) => URL.revokeObjectURL(rec.previewUrl))
    imgFiles.current.clear()
    if (editorRef.current) {
      editorRef.current.innerHTML = INIT_HTML
      editorRef.current.classList.add("editor-empty")
    }
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

  // 光标移到某元素文本末尾
  const placeCaretAtEnd = (el: HTMLElement) => {
    const sel = window.getSelection()
    if (!sel) return
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  const selectionInEditor = (): boolean => {
    const el = editorRef.current
    const sel = window.getSelection()
    if (!el || !sel || sel.rangeCount === 0) return false
    return el.contains(sel.getRangeAt(0).commonAncestorContainer)
  }

  // 在光标处（无光标则末尾）插入图片 + 图注
  const insertImages = useCallback((files: File[]) => {
    const editor = editorRef.current
    if (!editor || !files.length) return
    editor.focus()

    for (const file of files) {
      const uid = newUid()
      const previewUrl = URL.createObjectURL(file)
      imgFiles.current.set(uid, { file, previewUrl })

      const pImg = document.createElement("p")
      const img = document.createElement("img")
      img.src = previewUrl
      img.dataset.imgUid = uid
      img.alt = ""
      pImg.appendChild(img)
      const pCap = document.createElement("p")
      pCap.dataset.caption = "1"
      pCap.textContent = "图："

      if (selectionInEditor()) {
        const sel = window.getSelection()!
        const range = sel.getRangeAt(0)
        range.deleteContents()
        // 先插图注再插图片（insertNode 总在 range 起点插入）
        range.insertNode(pCap)
        range.insertNode(pImg)
        // 光标移到图注末尾，方便直接编辑
        const r2 = document.createRange()
        r2.setStart(pCap, pCap.childNodes.length)
        r2.collapse(true)
        sel.removeAllRanges()
        sel.addRange(r2)
      } else {
        editor.appendChild(pImg)
        editor.appendChild(pCap)
        placeCaretAtEnd(pCap)
      }
    }
    syncEmpty()
  }, [syncEmpty])

  // 粘贴：图片走插入流程；富文本只保留纯文本（避免脏标签进正文）
  const handlePaste = (e: React.ClipboardEvent) => {
    const cd = e.clipboardData
    const files: File[] = []
    for (const item of Array.from(cd.items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile()
        if (f) files.push(f)
      }
    }
    if (files.length) {
      e.preventDefault()
      insertImages(files)
      return
    }
    if (cd.types.includes("text/html")) {
      e.preventDefault()
      document.execCommand("insertText", false, cd.getData("text/plain"))
    }
  }

  // 拖拽图片文件插入
  const handleDrop = (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (!files.length) return
    e.preventDefault()
    insertImages(files)
  }

  // 遍历正文 DOM → 段落列表（图片段 + 图注归属 + 文本段）
  const collectParas = (): Para[] => {
    const editor = editorRef.current
    if (!editor) return []
    const paras: Para[] = []
    let prevImgUid: string | null = null
    for (const node of Array.from(editor.children)) {
      if (!(node instanceof HTMLElement)) continue
      const img = node.tagName === "IMG" ? node : node.querySelector<HTMLElement>(":scope > img[data-img-uid]")
      if (img && img.dataset.imgUid) {
        paras.push({ type: "img", uid: img.dataset.imgUid, caption: "" })
        prevImgUid = img.dataset.imgUid
        continue
      }
      const raw = (node.innerText ?? node.textContent ?? "").replace(/\u00a0/g, " ")
      const lines = raw.split("\n").map((s) => s.trim()).filter(Boolean)
      if (node.dataset.caption !== undefined && prevImgUid) {
        const last = paras[paras.length - 1]
        if (last?.type === "img") last.caption = lines.join(" ")
        prevImgUid = null
        continue
      }
      prevImgUid = null
      if (lines.length) paras.push({ type: "text", text: lines.join("\n") })
    }
    return paras
  }

  // ── 发布 ──
  const handleSubmit = async () => {
    if (!title.trim()) { setErrorMsg("请填写标题"); setStatus("error"); return }
    const paras = collectParas()
    if (!paras.length) { setErrorMsg("请输入正文内容"); setStatus("error"); return }
    if (!GITHUB_CONFIG.token) { setErrorMsg("未配置 GitHub Token"); setStatus("error"); return }

    setStatus("uploading")
    setErrorMsg("")

    try {
      const slug = await makeSlug(title.trim())
      const imageUrl = new Map<string, string>()

      // 1. 上传正文中的图片（按出现顺序）→ public/images/{slug}-{n}.{ext}
      const images = paras.filter((p): p is Extract<Para, { type: "img" }> => p.type === "img")
      for (let i = 0; i < images.length; i++) {
        const rec = imgFiles.current.get(images[i].uid)
        if (!rec) continue
        setPhase(`上传图片中（${i + 1}/${images.length}）...`)
        const rawExt = (rec.file.name.split(".").pop() || "jpg").toLowerCase()
        const ext = IMAGE_EXT_WHITELIST.has(rawExt) ? rawExt : "jpg"
        const name = `${slug}-${i + 1}.${ext}`
        const res = await fetch(githubApiUrl(`public/images/${name}`), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GITHUB_CONFIG.token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            message: `blog: upload image ${name}`,
            content: await fileToBase64(rec.file),
            branch: GITHUB_CONFIG.branch,
          }),
        })
        if (!res.ok) throw new Error(`图片上传失败: ${(await res.json()).message}`)
        imageUrl.set(images[i].uid, `/images/${name}`)
      }

      // 2. 序列化为 markdown（文本转义 MDX 特殊字符；段内换行为硬换行）
      const parts: string[] = []
      for (const p of paras) {
        if (p.type === "text") {
          parts.push(p.text.split("\n").map(escapeText).join("  \n"))
        } else {
          const url = imageUrl.get(p.uid)
          if (!url) continue
          const cap = p.caption.trim()
          parts.push(`![${cap ? escapeText(cap) : "image"}](${url})`)
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

  const toolbarBtn = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-[var(--accent)]"
      style={{ borderColor: "var(--glass-border)", color: "var(--text-light)" }}
    >
      {icon} {label}
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <style>{`
        .rich-editor.editor-empty::before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>

      <div
        className="flex max-h-[92vh] w-[min(1520px,94vw)] flex-col overflow-hidden rounded-[var(--radius)]"
        style={{
          background: isDark ? "#242428" : "#ffffff",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-hover)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部：标题 + 工具栏（左） / 发布 + 关闭（右） */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>添加博客</h2>
            {toolbarBtn(<ImageIcon size={13} />, "图片", () => fileInputRef.current?.click())}
          </div>
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

            {/* 正文编辑区（Word 式：一个富文本区，图片嵌在文字中间） */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="正文"
              data-placeholder="写点什么...（图片会插入光标处，回车分段）"
              className="rich-editor prose max-w-none min-h-[480px] flex-1 overflow-y-auto border-t px-6 py-5 outline-none"
              style={{ borderColor: "var(--glass-border)" }}
              onInput={syncEmpty}
              onPaste={handlePaste}
              onDrop={handleDrop}
              dangerouslySetInnerHTML={initHtml}
            />

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
                <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <ArrowUpToLine size={13} />
                  发布后自动推送到 GitHub，Actions 部署完成后生效；图片粘贴/拖拽也可插入
                </p>
              )}
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { insertImages(Array.from(e.target.files ?? [])); e.target.value = "" }}
          className="hidden"
        />
      </div>
    </div>
  )
}
