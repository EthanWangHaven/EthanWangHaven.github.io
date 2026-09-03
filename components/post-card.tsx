"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Calendar, Clock, Tag } from "lucide-react"
import type { PostMeta } from "@/lib/types"
import { getReadingTime } from "@/lib/types"

interface PostCardProps {
  post: PostMeta
  index?: number
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const readingTime = getReadingTime(post.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      className="h-full"
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <article
          className="group h-full rounded-[var(--radius)] p-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-hover)"
            e.currentTarget.style.borderColor = "var(--accent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow)"
            e.currentTarget.style.borderColor = "var(--glass-border)"
          }}
        >
          {/* 分类标签 */}
          {post.categories.length > 0 && (
            <div className="mb-3 flex gap-2">
              {post.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-[var(--accent-light)] px-3 py-0.5 text-xs font-medium text-[var(--accent-dark)]"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <h3 className="mb-2 text-lg font-bold leading-snug transition-colors group-hover:text-[var(--accent)]">
            {post.title}
          </h3>

          {/* 描述 */}
          {post.description && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--text-light)]">
              {post.description}
            </p>
          )}

          {/* 底部信息 */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {new Date(post.date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {readingTime} 分钟
            </span>
            {post.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag size={13} />
                {post.tags.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  )
}
