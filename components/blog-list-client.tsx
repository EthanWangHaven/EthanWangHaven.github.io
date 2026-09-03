"use client"

import { useState, useEffect } from "react"
import { PostCard } from "@/components/post-card"
import { Pagination } from "@/components/pagination"
import type { PostMeta } from "@/lib/types"

const POSTS_PER_PAGE = 20

interface BlogListClientProps {
  posts: PostMeta[]
}

export function BlogListClient({ posts }: BlogListClientProps) {
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = Number(params.get("page")) || 1
    setCurrentPage(Math.max(1, Math.min(totalPages || 1, p)))
  }, [totalPages])

  const start = (currentPage - 1) * POSTS_PER_PAGE
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE)

  return (
    <>
      <p className="mb-8 text-sm text-[var(--text-light)]">
        共 {posts.length} 篇文章
      </p>
      {pagePosts.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {pagePosts.map((post, idx) => (
              <PostCard key={post.slug} post={post} index={idx} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/blog"
          />
        </>
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
          还没有文章
        </div>
      )}
    </>
  )
}
