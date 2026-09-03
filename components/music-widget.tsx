"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"

const SONG_ID = "2707652860"
const SONG_TITLE = "半句再见"
const SONG_ARTIST = "孙燕姿"

export function MusicWidget() {
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Collapsed: floating button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          aria-label="展开音乐播放器"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:scale-105"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
          }}
        >
          <span className="flex h-4 items-end gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-[var(--accent)]"
                style={{
                  animation: `eqBar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                }}
              />
            ))}
          </span>
          <style>{`
            @keyframes eqBar {
              0% { height: 3px; }
              100% { height: 14px; }
            }
          `}</style>
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          </span>
        </button>
      )}

      {/* Expanded: player card */}
      {expanded && (
        <div
          className="w-[340px] overflow-hidden rounded-3xl transition-all duration-300"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow-hover)",
          }}
        >
          {/* Top section: vinyl record + song info */}
          <div
            className="relative overflow-hidden px-5 pt-5 pb-3"
            style={{
              background: "linear-gradient(160deg, var(--accent-light) 0%, transparent 70%)",
            }}
          >
            {/* Close button - top right */}
            <button
              onClick={() => setExpanded(false)}
              aria-label="收起播放器"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/10"
            >
              <ChevronDown size={16} />
            </button>

            {/* Vinyl record + info layout */}
            <div className="flex items-center gap-4">
              {/* Spinning vinyl record */}
              <div className="relative h-16 w-16 shrink-0">
                {/* Outer ring glow */}
                <div
                  className="absolute -inset-1 rounded-full opacity-30 blur-md"
                  style={{ background: "var(--accent)" }}
                />
                {/* Record disc */}
                <div
                  className="relative h-full w-full rounded-full animate-spin"
                  style={{
                    background: "conic-gradient(from 0deg, var(--accent), var(--accent-dark), var(--accent))",
                    animationDuration: "4s",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                  }}
                />
                {/* Record grooves */}
                <div
                  className="absolute inset-1.5 rounded-full"
                  style={{
                    background: "repeating-radial-gradient(circle, transparent 0, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 3px)",
                  }}
                />
                {/* Center label */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: "var(--bg-card-solid)" }}
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Song info */}
              <div className="flex flex-1 flex-col gap-1 pr-6">
                <span className="truncate text-sm font-bold text-[var(--text)]">
                  {SONG_TITLE}
                </span>
                <span className="truncate text-xs text-[var(--text-light)]">
                  {SONG_ARTIST}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[0.65rem] text-[var(--text-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  网易云音乐
                </span>
              </div>
            </div>

            {/* Decorative progress bar */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[0.6rem] tabular-nums text-[var(--text-muted)]">00:00</span>
              <div className="group relative h-1 flex-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: "35%",
                    background: "linear-gradient(90deg, var(--accent), var(--accent-dark))",
                  }}
                />
                <div
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-transform"
                  style={{
                    left: "35%",
                    background: "var(--accent)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  }}
                />
              </div>
              <span className="text-[0.6rem] tabular-nums text-[var(--text-muted)]">06:56</span>
            </div>
          </div>

          {/* Player iframe */}
          <div
            className="px-3 pb-3"
            style={{
              background: "linear-gradient(180deg, transparent 0%, var(--accent-light) 100%)",
            }}
          >
            <iframe
              src={`https://music.163.com/outchain/player?type=2&id=${SONG_ID}&auto=1&height=66`}
              width="100%"
              height="86"
              frameBorder="no"
              marginWidth={0}
              marginHeight={0}
              allow="autoplay"
              className="block rounded-xl"
              style={{
                border: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
