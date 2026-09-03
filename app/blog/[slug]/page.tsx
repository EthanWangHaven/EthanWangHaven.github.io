import { notFound } from "next/navigation"
import Link from "next/link"
import { getAllPosts, getPostBySlug, getReadingTime } from "@/lib/posts"
import { MdxRenderer } from "@/components/mdx-renderer"
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react"

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: "未找到" }
  return {
    title: post.title,
    description: post.description,
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const readingTime = getReadingTime(post.content)

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      {/* 返回按钮 */}
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--text-light)] transition-colors hover:text-[var(--accent)]"
      >
        <ArrowLeft size={16} /> 返回博客
      </Link>

      {/* 文章头部 */}
      <header className="mb-6">
        {/* 分类 */}
        {post.categories.length > 0 && (
          <div className="mb-2 flex gap-2">
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
        <h1 className="mb-2 text-2xl font-bold leading-tight md:text-3xl">
          {post.title}
        </h1>

        {/* 简介 */}
        {post.description && (
          <p className="mb-4 text-sm leading-relaxed text-[var(--text-light)]">
            {post.description}
          </p>
        )}

        {/* 元信息 */}
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Calendar size={15} />
            {new Date(post.date).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={15} />
            {readingTime} 分钟阅读
          </span>
        </div>

        {/* 标签 */}
        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-black/[0.03] px-3 py-1 text-xs text-[var(--text-light)] dark:bg-white/[0.05]"
              >
                <Tag size={11} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 分割线 */}
      <hr className="mb-6 border-none border-t border-black/[0.04] dark:border-white/[0.04]" />

      {/* MDX 内容 */}
      <MdxRenderer content={post.content} />
    </article>
  )
}
