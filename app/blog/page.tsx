import { getAllPosts } from "@/lib/posts"
import { PostCard } from "@/components/post-card"
import { Pagination } from "@/components/pagination"

export const metadata = {
  title: "博客",
  description: "所有文章列表",
}

const POSTS_PER_PAGE = 20

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const posts = getAllPosts()
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const sp = await searchParams
  const currentPage = Math.max(1, Math.min(totalPages || 1, Number(sp.page) || 1))
  const start = (currentPage - 1) * POSTS_PER_PAGE
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE)

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">博客</h1>
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
          <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/blog" />
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
    </div>
  )
}
