"use client"

import { useState, useEffect, useRef } from "react"
import type { Heading } from "@/lib/extract-headings"
import { List, ChevronRight } from "lucide-react"

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("")
  const [collapsed, setCollapsed] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (headings.length === 0) return

    observerRef.current?.disconnect()

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: [0, 1],
      }
    )

    observerRef.current = observer

    headings.forEach((h) => {
      const el = document.getElementById(h.slug)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav
      className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
      aria-label="目录"
    >
      <div
        className="toc-scroll max-h-[70vh] overflow-y-auto rounded-2xl transition-all duration-300"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
          maxWidth: collapsed ? "44px" : "240px",
          padding: collapsed ? "8px" : "12px 14px",
        }}
      >
        {/* Header with collapse toggle */}
        <div
          className={`flex items-center text-xs font-semibold text-[var(--text-light)] ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="展开目录"
              className="flex items-center justify-center text-[var(--text-light)] transition-colors hover:text-[var(--accent)]"
            >
              <List size={15} />
            </button>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <List size={13} /> 目录
              </span>
              <button
                onClick={() => setCollapsed(true)}
                aria-label="收起目录"
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* Heading list */}
        {!collapsed && (
          <ul className="mt-3 space-y-1 border-l border-black/8 dark:border-white/8">
            {headings.map((h) => (
              <li key={h.slug}>
                <a
                  href={`#${h.slug}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById(h.slug)
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 80
                      window.scrollTo({ top: y, behavior: "smooth" })
                      setActiveId(h.slug)
                    }
                  }}
                  className={`block truncate border-l-2 transition-all duration-200 ${
                    h.level === 3 ? "pl-3" : "pl-2"
                  } ${
                    activeId === h.slug
                      ? "border-[var(--accent)] font-medium text-[var(--accent)]"
                      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-black/15 dark:hover:border-white/15"
                  }`}
                  style={{
                    fontSize: h.level === 3 ? "0.72rem" : "0.78rem",
                    lineHeight: "1.4",
                    marginLeft: "-1px",
                    maxWidth: "210px",
                  }}
                  title={h.text}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`
        .toc-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .toc-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .toc-scroll::-webkit-scrollbar-thumb {
          background: var(--glass-border);
          border-radius: 3px;
          backdrop-filter: blur(8px);
        }
        .toc-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }
      `}</style>
    </nav>
  )
}
