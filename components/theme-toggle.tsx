"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-10 w-10 md:h-11 md:w-11" />

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-white/[0.15] dark:hover:bg-white/[0.08] md:h-11 md:w-11"
      aria-label="切换主题"
      title={isDark ? "浅色" : "深色"}
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
      >
        {isDark ? (
          <Moon
            size={20}
            className="text-[var(--text-light)] transition-colors group-hover:text-[var(--text)]"
          />
        ) : (
          <Sun
            size={20}
            className="text-[var(--text-light)] transition-colors group-hover:text-[var(--text)]"
          />
        )}
      </motion.div>
    </button>
  )
}
