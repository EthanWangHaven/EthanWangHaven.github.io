import Link from "next/link"
import { getAllCategories } from "@/lib/posts"

export const metadata = {
  title: "Categories",
  description: "所有分类",
}

export default function CategoriesPage() {
  const categories = getAllCategories()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">Categories</h1>
      <p className="mb-8 text-sm text-[var(--text-light)]">
        共 {categories.length} 个分类
      </p>

      {categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map((item) => (
            <Link
              key={item.category}
              href={`/categories/${encodeURIComponent(item.category)}`}
              className="group flex items-center justify-between rounded-[var(--radius)] px-6 py-4 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <span className="font-medium transition-colors group-hover:text-[var(--accent)]">
                {item.category}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                {item.count} 篇
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
          还没有分类
        </div>
      )}
    </div>
  )
}
