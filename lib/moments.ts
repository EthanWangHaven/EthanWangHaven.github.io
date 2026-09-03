import fs from "fs"
import path from "path"
import matter from "gray-matter"
import type { MomentMeta } from "./types"

const MOMENTS_DIR = path.join(process.cwd(), "content", "moments")

let _momentsCache: MomentMeta[] | null = null

export function getAllMoments(): MomentMeta[] {
  if (_momentsCache) return _momentsCache

  if (!fs.existsSync(MOMENTS_DIR)) return []

  const files = fs.readdirSync(MOMENTS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))

  const moments = files.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, "")
    const fullPath = path.join(MOMENTS_DIR, filename)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const { data, content } = matter(raw)

    return {
      slug,
      title: (data.title as string) || slug,
      date: (data.date as string) || new Date().toISOString(),
      location: (data.location as string) || undefined,
      cover: (data.cover as string) || undefined,
      description: (data.description as string) || undefined,
      content,
    } as MomentMeta
  })

  _momentsCache = moments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return _momentsCache
}

export function getMomentBySlug(slug: string): MomentMeta | null {
  const moments = getAllMoments()
  return moments.find((m) => m.slug === slug) || null
}
