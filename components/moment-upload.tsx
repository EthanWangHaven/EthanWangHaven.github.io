"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, X, Upload, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

/* ============================================================
 * Moment 上传组件
 * 通过 GitHub REST API 直接提交 .mdx 文件和图片到仓库
 * 需要 GitHub Fine-grained Token (contents:write)
 * ============================================================ */

// ── 配置：在下方填写你的 GitHub Token ──
const GITHUB_CONFIG = {
  token: "", // 在此填入你的 GitHub Fine-grained Token
  owner: "EthanWangHaven",
  repo: "EthanWangHaven.github.io",
  branch: "main",
}

type Status = "idle" | "uploading" | "success" | "error"

export function MomentUpload() {
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>("idle")
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

  const reset = () => {
    setTitle("")
    setDescription("")
    setLocation("")
    setImageFile(null)
    setImagePreview(null)
    setStatus("idle")
    setErrorMsg("")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(",")[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg("请填写标题")
      return
    }
    if (!GITHUB_CONFIG.token) {
      setErrorMsg("未配置 GitHub Token，请在组件中配置")
      setStatus("error")
      return
    }

    setStatus("uploading")
    setErrorMsg("")

    try {
      const now = new Date()
      const dateStr = now.toISOString().split("T")[0]
      const timestamp = now.getTime()
      const slug = `moment-${timestamp}`

      let coverPath = ""
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg"
        const imagePath = `public/img/moments/${slug}.${ext}`
        const base64 = await fileToBase64(imageFile)

        const imgRes = await fetch(
          `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${imagePath}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${GITHUB_CONFIG.token}`,
              "Content-Type": "application/json",
              Accept: "application/vnd.github+json",
            },
            body: JSON.stringify({
              message: `upload: ${slug} image`,
              content: base64,
              branch: GITHUB_CONFIG.branch,
            }),
          }
        )

        if (!imgRes.ok) {
          const err = await imgRes.json()
          throw new Error(`图片上传失败: ${err.message}`)
        }
        coverPath = `/img/moments/${slug}.${ext}`
      }

      const mdxPath = `content/moments/${slug}.mdx`
      const mdxContent = `---\ntitle: "${title}"\ndate: "${dateStr}"\n${location ? `location: "${location}"\n` : ""}${coverPath ? `cover: "${coverPath}"\n` : ""}${description ? `description: "${description}"\n` : ""}---\n`

      const base64Mdx = btoa(unescape(encodeURIComponent(mdxContent)))

      const mdxRes = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${mdxPath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GITHUB_CONFIG.token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            message: `add moment: ${title}`,
            content: base64Mdx,
            branch: GITHUB_CONFIG.branch,
          }),
        }
      )

      if (!mdxRes.ok) {
        const err = await mdxRes.json()
        throw new Error(`MDX 创建失败: ${err.message}`)
      }

      setStatus("success")
      setTimeout(() => {
        setOpen(false)
        reset()
      }, 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "上传失败")
      setStatus("error")
    }
  }

  // 收起状态：内联加号按钮（与音乐按钮同尺寸）
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow)",
        }}
        aria-label="新增 Moment"
      >
        <Plus size={24} className="text-[var(--accent)]" />
      </button>
    )
  }

  // 弹窗背景：约 30% 透明度（70% 不透明）
  const modalBg = isDark ? "rgba(28, 28, 38, 0.70)" : "rgba(255, 255, 255, 0.70)"

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
        onClick={() => { if (status !== "uploading") { setOpen(false); reset() } }}
      >
        {/* 弹窗 */}
        <div
          className="w-[min(440px,90vw)] overflow-hidden rounded-[var(--radius)] p-6"
          style={{
            background: modalBg,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow-hover)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">新增 Moment</h2>
            <button
              onClick={() => { if (status !== "uploading") { setOpen(false); reset() } }}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-label="关闭"
            >
              <X size={20} />
            </button>
          </div>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 size={48} className="text-green-500" />
              <p className="text-sm font-medium">上传成功！GitHub Actions 将自动部署。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 标题 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-light)]">标题 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给这个瞬间起个名字"
                  className="w-full rounded-[var(--radius-xs)] border px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    background: isDark ? "rgba(40,40,50,0.6)" : "rgba(245,245,250,0.8)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text)",
                  }}
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-light)]">描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="记录此刻的感受..."
                  rows={3}
                  className="w-full resize-none rounded-[var(--radius-xs)] border px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    background: isDark ? "rgba(40,40,50,0.6)" : "rgba(245,245,250,0.8)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text)",
                  }}
                />
              </div>

              {/* 位置 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-light)]">位置</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="上海 / 北京 / ..."
                  className="w-full rounded-[var(--radius-xs)] border px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    background: isDark ? "rgba(40,40,50,0.6)" : "rgba(245,245,250,0.8)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text)",
                  }}
                />
              </div>

              {/* 图片上传 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-light)]">封面图片</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-[var(--radius-xs)]" style={{ border: "1px solid var(--glass-border)" }}>
                    <img src={imagePreview} alt="preview" className="h-40 w-full object-cover" />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/60"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-xs)] border border-dashed transition-colors hover:border-[var(--accent)]"
                    style={{
                      borderColor: "var(--glass-border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <ImageIcon size={28} />
                    <span className="text-xs">点击选择图片</span>
                  </button>
                )}
              </div>

              {/* 错误信息 */}
              {status === "error" && (
                <div className="flex items-start gap-2 rounded-[var(--radius-xs)] p-3" style={{ background: "rgba(220,80,80,0.08)" }}>
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="text-xs text-red-600">{errorMsg}</span>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                onClick={handleSubmit}
                disabled={status === "uploading" || !title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-xs)] py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                }}
              >
                {status === "uploading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    保存并同步到 GitHub
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
