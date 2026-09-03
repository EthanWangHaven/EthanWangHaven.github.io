import Link from "next/link"
import { getAllPosts, getAllTags, getAllCategories } from "@/lib/posts"
import { PostCard } from "@/components/post-card"
import { siteConfig } from "@/lib/site-config"
import { ArrowRight, BookOpen, Tag, FolderTree } from "lucide-react"

export default function HomePage() {
  const posts = getAllPosts()
  const tags = getAllTags()
  const categories = getAllCategories()
  const recentPosts = posts.slice(0, 4)

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      {/* Hero */}
      <section className="mb-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 overflow-hidden rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <img
              src={siteConfig.avatar}
              alt={siteConfig.author.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <h1 className="mb-3 text-3xl font-bold md:text-4xl">
          {siteConfig.title}
        </h1>
        <p className="text-base text-[var(--text-light)] md:text-lg">
          {siteConfig.description}
        </p>
      </section>

      {/* 统计卡片 */}
      <section className="mb-16 grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "文章", value: posts.length, href: "/blog" },
          { icon: Tag, label: "标签", value: tags.length, href: "/tags" },
          { icon: FolderTree, label: "分类", value: categories.length, href: "/categories" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-[var(--radius)] p-5 text-center transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <stat.icon
              size={24}
              className="mx-auto mb-2 text-[var(--accent)] transition-transform group-hover:scale-110"
            />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[var(--text-light)]">{stat.label}</div>
          </Link>
        ))}
      </section>

      {/* 最近文章 */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">最近文章</h2>
          <Link
            href="/blog"
            className="flex items-center gap-1 text-sm text-[var(--accent)] transition-opacity hover:opacity-70"
          >
            查看全部 <ArrowRight size={16} />
          </Link>
        </div>
        {recentPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {recentPosts.map((post, idx) => (
              <PostCard key={post.slug} post={post} index={idx} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] p-12 text-center text-[var(--text-muted)]" style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow)",
          }}>
            还没有文章，请先迁移内容
          </div>
        )}
      </section>
    </div>
  )
}
