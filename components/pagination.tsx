import Link from "next/link"

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  const pageUrl = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)

  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--accent-light)]"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow)",
          }}
        >
          ←
        </Link>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-sm text-[var(--text-muted)] opacity-40">
          ←
        </span>
      )}

      {/* 页码 */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-[var(--text-muted)]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageUrl(p)}
            className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
              p === currentPage
                ? "bg-[var(--accent)] text-white"
                : "hover:bg-[var(--accent-light)]"
            }`}
            style={
              p === currentPage
                ? undefined
                : {
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow)",
                  }
              }
          >
            {p}
          </Link>
        )
      )}

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link
          href={pageUrl(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--accent-light)]"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow)",
          }}
        >
          →
        </Link>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-sm text-[var(--text-muted)] opacity-40">
          →
        </span>
      )}
    </nav>
  )
}
