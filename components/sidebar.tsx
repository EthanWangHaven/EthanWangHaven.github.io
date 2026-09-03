"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  Home,
  Book,
  Tag,
  Folder,
  Languages,
  Image as ImageIcon,
  Search,
  type LucideIcon,
} from "lucide-react"
import { siteConfig } from "@/lib/site-config"
import { ThemeToggle } from "./theme-toggle"
import { useCallback } from "react"

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  book: Book,
  tag: Tag,
  folder: Folder,
  language: Languages,
  image: ImageIcon,
}

interface SidebarProps {
  onSearchOpen: () => void
}

export function Sidebar({ onSearchOpen }: SidebarProps) {
  const pathname = usePathname()

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/"
      return pathname.startsWith(href)
    },
    [pathname]
  )

  return (
    <>
      {/* 桌面端：胶囊式竖向悬浮毛玻璃侧边栏 */}
      <aside
        className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-full px-2 py-4 md:flex"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        {/* 导航项 */}
        <nav className="flex flex-col gap-1">
          {siteConfig.nav.map((item) => {
            const Icon = iconMap[item.icon] || Home
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:bg-white/[0.15] dark:hover:bg-white/[0.08]"
                title={item.name}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-full bg-[var(--accent-light)]"
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                <Icon
                  size={20}
                  className={`relative z-10 transition-colors ${
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-light)] group-hover:text-[var(--text)]"
                  }`}
                />
              </Link>
            )
          })}
        </nav>

        {/* 分割线 */}
        <div className="my-1 h-px w-7 bg-black/[0.06] dark:bg-white/[0.08]" />

        {/* 底部：搜索 + 主题切换 */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onSearchOpen}
            className="group flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:bg-white/[0.15] dark:hover:bg-white/[0.08]"
            title="搜索"
          >
            <Search
              size={20}
              className="text-[var(--text-light)] transition-colors group-hover:text-[var(--text)]"
            />
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* 移动端：胶囊式悬浮毛玻璃底部导航 */}
      <nav
        className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-2 md:hidden"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        {siteConfig.nav.map((item) => {
          const Icon = iconMap[item.icon] || Home
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300"
              title={item.name}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-mobile"
                  className="absolute inset-0 rounded-full bg-[var(--accent-light)]"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <Icon
                size={20}
                className={`relative z-10 transition-colors ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-light)]"
                }`}
              />
            </Link>
          )
        })}
        {/* 搜索按钮 */}
        <div className="mx-0.5 h-5 w-px bg-black/[0.06] dark:bg-white/[0.08]" />
        <button
          onClick={onSearchOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-white/[0.15] dark:hover:bg-white/[0.08]"
          title="搜索"
        >
          <Search size={20} className="text-[var(--text-light)]" />
        </button>
      </nav>
    </>
  )
}
