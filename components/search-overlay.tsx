"use client"

import { motion, AnimatePresence } from "motion/react"
import { Search, X, FileText } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchResult {
  slug: string
  title: string
  description?: string
  categories?: string[]
  tags?: string[]
  type: "post" | "page"
}

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [allPosts, setAllPosts] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 加载所有文章数据
  useEffect(() => {
    fetch("/api/search")
      .then((res) => res.json())
      .then((data) => setAllPosts(data))
      .catch(() => {})
  }, [])

  // 搜索逻辑
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const filtered = allPosts.filter((post) => {
      return (
        post.title?.toLowerCase().includes(q) ||
        post.description?.toLowerCase().includes(q) ||
        post.categories?.some((c) => c.toLowerCase().includes(q)) ||
        post.tags?.some((t) => t.toLowerCase().includes(q))
      )
    })
    setResults(filtered.slice(0, 8))
    setSelectedIndex(0)
  }, [query, allPosts])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === "Enter" && results[selectedIndex]) {
        router.push(`/blog/${results[selectedIndex].slug}`)
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, results, selectedIndex, router, onClose])

  // 自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/10 pt-[15vh] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="w-[90%] max-w-xl overflow-hidden rounded-[var(--radius)]"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索输入 */}
            <div className="flex items-center gap-3 border-b border-black/[0.04] px-5 py-4">
              <Search size={20} className="shrink-0 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文章..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
              <button
                onClick={onClose}
                className="rounded-[var(--radius-xs)] p-1 text-[var(--text-muted)] transition-colors hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* 搜索结果 */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {query && results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  未找到相关文章
                </div>
              )}
              {!query && (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  输入关键词搜索文章
                </div>
              )}
              {results.map((result, idx) => (
                <Link
                  key={result.slug}
                  href={`/blog/${result.slug}`}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3 transition-colors ${
                    idx === selectedIndex
                      ? "bg-[var(--accent-light)]"
                      : "hover:bg-black/[0.02]"
                  }`}
                >
                  <FileText
                    size={18}
                    className="shrink-0 text-[var(--text-muted)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {result.title}
                    </div>
                    {result.description && (
                      <div className="truncate text-xs text-[var(--text-muted)]">
                        {result.description}
                      </div>
                    )}
                  </div>
                  {result.categories && result.categories.length > 0 && (
                    <span className="shrink-0 rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-xs text-[var(--accent-dark)]">
                      {result.categories[0]}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
