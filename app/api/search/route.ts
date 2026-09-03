import { NextResponse } from "next/server"
import { getAllPosts } from "@/lib/posts"

export const dynamic = "force-static"

export async function GET() {
  const posts = getAllPosts()
  const data = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    categories: p.categories,
    tags: p.tags,
    type: "post" as const,
  }))
  return NextResponse.json(data)
}
