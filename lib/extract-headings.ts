export interface Heading {
  level: 2 | 3
  text: string
  slug: string
}

/** GitHub-style slugify, compatible with rehype-slug */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Extract h2/h3 headings from raw markdown content, deduplicating slugs */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = []
  const seenSlugs = new Map<string, number>()
  const lines = content.split("\n")
  let inCodeBlock = false

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length as 2 | 3
      const rawText = match[2]
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim()

      let slug = slugify(rawText)
      // Deduplicate: if slug already seen, append -2, -3, etc.
      const count = seenSlugs.get(slug) ?? 0
      seenSlugs.set(slug, count + 1)
      if (count > 0) {
        slug = `${slug}-${count + 1}`
      }

      headings.push({ level, text: rawText, slug })
    }
  }

  return headings
}
