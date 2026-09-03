"use client"

import { useState, useEffect } from "react"
import { siteConfig } from "@/lib/site-config"

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const key = "__splash_shown"
    if (sessionStorage.getItem(key)) {
      setVisible(false)
      return
    }
    sessionStorage.setItem(key, "1")

    const fadeTimer = setTimeout(() => setFading(true), 1300)
    const removeTimer = setTimeout(() => setVisible(false), 1900)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-600 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "var(--bg)",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--blob-1)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--blob-2)" }}
      />

      {/* Centered content */}
      <div className="relative flex flex-col items-center justify-center gap-6">
        {/* Spinner ring */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <svg className="absolute h-full w-full animate-spin" viewBox="0 0 44 44" fill="none">
            <circle
              cx="22" cy="22" r="20"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.15"
            />
            <circle
              cx="22" cy="22" r="20"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="40 126"
              opacity="0.9"
            />
          </svg>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 12px var(--accent)",
            }}
          />
        </div>

        {/* Site name */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold tracking-wider" style={{ color: "var(--text)" }}>
            {siteConfig.title}
          </h1>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: "var(--accent)",
                  animation: `splashDot 0.9s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes splashDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
