export interface PostMeta {
  slug: string
  title: string
  date: string
  categories: string[]
  tags: string[]
  draft: boolean
  description: string
  content: string
}

export interface MomentMeta {
  slug: string
  title: string
  date: string
  location?: string
  cover?: string
  description?: string
  content: string
}

export function getReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function getWordCount(content: string): number {
  return content.trim().split(/\s+/).length
}
