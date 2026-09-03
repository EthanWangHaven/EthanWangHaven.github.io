"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { SearchOverlay } from "./search-overlay"
import { Fireflies } from "./fireflies"
import { SplashScreen } from "./splash-screen"
import { MusicPlayer } from "./music-player"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  // Ctrl/Cmd+K 打开搜索
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  return (
    <>
      <SplashScreen />
      <Fireflies />
      <Sidebar onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <MusicPlayer />
      <main id="main-content" className="min-h-screen pb-20 md:pb-8 md:pl-24">{children}</main>
    </>
  )
}
