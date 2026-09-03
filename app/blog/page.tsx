import { getAllPosts } from "@/lib/posts"
import { BlogListClient } from "@/components/blog-list-client"

export const metadata = {
  title: "博客",
  description: "所有文章列表",
}

export default function BlogPage() {
  const posts = getAllPosts()
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">博客</h1>
      <BlogListClient posts={posts} />
    </div>
  )
}
