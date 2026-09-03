import fs from "fs"
import path from "path"
import matter from "gray-matter"
import type { PostMeta } from "./types"
import { getReadingTime, getWordCount } from "./types"

const BLOG_DIR = path.join(process.cwd(), "content", "blog")

function generateExcerpt(content: string, maxLen = 100): string {
  const text = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/[*`_~>]/g, "")
    .replace(/\n+/g, " ")
    .trim()
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, "")
    const fullPath = path.join(BLOG_DIR, filename)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const { data, content } = matter(raw)

    return {
      slug,
      title: (data.title as string) || slug,
      date: (data.date as string) || new Date().toISOString(),
      categories: (data.categories as string[]) || [],
      tags: (data.tags as string[]) || [],
      draft: (data.draft as boolean) ?? false,
      description: (data.description as string) || generateExcerpt(content),
      content,
    } as PostMeta
  })

  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): PostMeta | null {
  const posts = getAllPosts()
  const decoded = decodeURIComponent(slug)
  return posts.find((p) => p.slug === decoded || p.slug === slug) || null
}

export function getAllTags(): { tag: string; count: number }[] {
  const posts = getAllPosts()
  const tagMap = new Map<string, number>()
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
    })
  })
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

export function getAllCategories(): { category: string; count: number }[] {
  const posts = getAllPosts()
  const catMap = new Map<string, number>()
  posts.forEach((post) => {
    post.categories.forEach((cat) => {
      catMap.set(cat, (catMap.get(cat) || 0) + 1)
    })
  })
  return Array.from(catMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag))
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter((p) => p.categories.includes(category))
}

export { getReadingTime, getWordCount }
