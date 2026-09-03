import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div
        className="max-w-md rounded-[var(--radius)] p-12 text-center"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        <h1 className="mb-4 text-6xl font-bold text-[var(--accent)]">404</h1>
        <p className="mb-2 text-lg font-medium">页面未找到</p>
        <p className="mb-8 text-sm text-[var(--text-light)]">
          你访问的页面不存在或已被移动
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-light)] px-6 py-3 text-sm font-medium text-[var(--accent-dark)] transition-all hover:scale-105"
        >
          <Home size={18} />
          返回首页
        </Link>
      </div>
    </div>
  )
}
