import { notFound } from "next/navigation"
import { getAllTags, getPostsByTag } from "@/lib/posts"
import { PostCard } from "@/components/post-card"

export async function generateStaticParams() {
  const tags = getAllTags()
  return tags.map((item) => ({ tag: encodeURIComponent(item.tag) }))
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: encodedTag } = await params
  const tag = decodeURIComponent(encodedTag)
  return { title: `#${tag}` }
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: encodedTag } = await params
  const tag = decodeURIComponent(encodedTag)
  const posts = getPostsByTag(tag)

  if (posts.length === 0) notFound()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">
        <span className="text-[var(--accent)]">#</span>
        {tag}
      </h1>
      <p className="mb-8 text-sm text-[var(--text-light)]">
        共 {posts.length} 篇文章
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map((post, idx) => (
          <PostCard key={post.slug} post={post} index={idx} />
        ))}
      </div>
    </div>
  )
}
