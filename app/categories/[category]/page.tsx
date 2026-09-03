import { notFound } from "next/navigation"
import { getAllCategories, getPostsByCategory } from "@/lib/posts"
import { PostCard } from "@/components/post-card"

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((item) => ({
    category: encodeURIComponent(item.category),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category: encodedCat } = await params
  const category = decodeURIComponent(encodedCat)
  return { title: category }
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: encodedCat } = await params
  const category = decodeURIComponent(encodedCat)
  const posts = getPostsByCategory(category)

  if (posts.length === 0) notFound()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">{category}</h1>
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
