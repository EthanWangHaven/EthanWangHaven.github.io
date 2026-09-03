import Link from "next/link"
import { BookOpen, Ear, Mic, FileText, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Languages",
  description: "语言学习工具",
}

interface LanguageTool {
  name: string
  href: string
  icon: typeof BookOpen
  description: string
}

interface LanguageSection {
  name: string
  flag: string
  color: string
  tools: LanguageTool[]
}

const languageSections: LanguageSection[] = [
  {
    name: "English",
    flag: "🇬🇧",
    color: "#8b7eb0",
    tools: [
      {
        name: "Vocabulary",
        href: "/languages/english/vocabulary/index.html",
        icon: BookOpen,
        description: "考研 & 六级单词，支持搜索、筛选、添加",
      },
      {
        name: "Reading",
        href: "/languages/english/reading/index.html",
        icon: FileText,
        description: "六级阅读练习，含选择题和评分",
      },
    ],
  },
  {
    name: "Deutsch",
    flag: "🇩🇪",
    color: "#d4a574",
    tools: [
      {
        name: "Vocabulary",
        href: "/languages/german/vocabulary/index.html",
        icon: BookOpen,
        description: "A1-C2 词汇表",
      },
      {
        name: "Grammar",
        href: "/languages/german/grammar/index.html",
        icon: FileText,
        description: "语法要点",
      },
      {
        name: "Pronunciation",
        href: "/languages/german/pronunciation/index.html",
        icon: Mic,
        description: "发音指南",
      },
    ],
  },
  {
    name: "日本語",
    flag: "🇯🇵",
    color: "#e8a0a0",
    tools: [
      {
        name: "Pronunciation",
        href: "/languages/japanese/pronunciation/index.html",
        icon: Mic,
        description: "五十音图与发音",
      },
      {
        name: "Grammar",
        href: "/languages/japanese/grammar/index.html",
        icon: FileText,
        description: "基础语法",
      },
    ],
  },
]

export default function LanguagesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">Languages</h1>
      <p className="mb-8 text-sm text-[var(--text-light)]">
        语言学习工具集合
      </p>

      <div className="space-y-8">
        {languageSections.map((section) => (
          <div key={section.name}>
            {/* Section header */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">{section.flag}</span>
              <h2 className="text-lg font-bold">{section.name}</h2>
            </div>

            {/* Tool cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.tools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group flex flex-col rounded-[var(--radius)] p-5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1"
                  style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow)",
                  }}
                  target="_blank"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)]"
                      style={{ backgroundColor: `${section.color}15` }}
                    >
                      <tool.icon size={20} style={{ color: section.color }} />
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-[var(--text-muted)] transition-transform group-hover:translate-x-1"
                    />
                  </div>
                  <h3 className="mb-1 font-bold transition-colors group-hover:text-[var(--accent)]">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-[var(--text-light)]">
                    {tool.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
