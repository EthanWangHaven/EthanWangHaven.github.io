import Link from "next/link"
import { getAllTags } from "@/lib/posts"

export const metadata = {
  title: "Tags",
  description: "所有标签",
}

export default function TagsPage() {
  const tags = getAllTags()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">Tags</h1>
      <p className="mb-8 text-sm text-[var(--text-light)]">
        共 {tags.length} 个标签
      </p>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map((item) => (
            <Link
              key={item.tag}
              href={`/tags/${encodeURIComponent(item.tag)}`}
              className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <span className="text-sm font-medium transition-colors group-hover:text-[var(--accent)]">
                {item.tag}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {item.count}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="rounded-[var(--radius)] p-12 text-center text-[var(--text-muted)]"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow)",
          }}
        >
          还没有标签
        </div>
      )}
    </div>
  )
}
