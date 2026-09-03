import { MDXRemote } from "next-mdx-remote/rsc"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"

interface MdxRendererProps {
  content: string
}

export function MdxRenderer({ content }: MdxRendererProps) {
  return (
    <div className="prose max-w-none">
      <MDXRemote
        source={content}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkMath, remarkGfm],
            rehypePlugins: [
              rehypeKatex,
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: "wrap",
                  properties: {
                    className: ["heading-anchor"],
                  },
                },
              ],
            ],
          },
        }}
      />
    </div>
  )
}
