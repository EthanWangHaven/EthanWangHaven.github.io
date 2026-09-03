"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Repeat, Repeat1,
  Maximize2, Minimize2, X, Music,
} from "lucide-react"
import { playlist as defaultPlaylist, type Song } from "@/lib/music-config"

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "00:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

type Mode = "collapsed" | "compact" | "expanded"

// ── Music player local color scheme (soft cool purple, readable on glass) ──
const MUSIC = {
  accent: "#b095ee",
  accentDark: "#9d80e0",
  accentLight: "rgba(176, 149, 238, 0.08)",
  text: "#2e2842",
  textLight: "#5e5872",
  textMuted: "#8a84a0",
  // dark mode
  accentD: "#c4b0f8",
  accentDarkD: "#b095ee",
  accentLightD: "rgba(196, 176, 248, 0.08)",
  textD: "#d8d2e8",
  textLightD: "#aca4c0",
  textMutedD: "#7a708e",
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lyricsRef = useRef<HTMLDivElement>(null)

  const [songs] = useState<Song[]>(defaultPlaylist)
  const [mode, setMode] = useState<Mode>("collapsed")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [muted, setMuted] = useState(false)
  const [loop, setLoop] = useState<"none" | "all" | "one">("none")
  const [activeTab, setActiveTab] = useState<"lyrics" | "playlist">("lyrics")
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1)

  // ── Drag state ──
  const [pos, setPos] = useState({ x: 0, y: 0 }) // 0,0 = bottom-right
  const [dragging, setDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const currentSong = songs[currentIndex]

  // ── Set initial position to bottom-right on mount ──
  useEffect(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const btnSize = 56
    const margin = 24
    setPos({
      x: w - btnSize - margin + btnSize / 2 - w / 2,
      y: h - btnSize - margin + btnSize / 2 - h / 2,
    })
  }, [])

  // ── Audio event listeners ──
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMeta = () => setDuration(audio.duration)
    const onEnded = () => {
      if (loop === "one") {
        audio.currentTime = 0
        audio.play()
      } else if (loop === "all") {
        setCurrentIndex((i) => (i + 1) % songs.length)
      } else {
        setIsPlaying(false)
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMeta)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMeta)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
    }
  }, [loop, songs.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    if (isPlaying) audio.play().catch(() => {})
  }, [currentIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  useEffect(() => {
    const lyrics = currentSong.lyrics
    if (!lyrics || lyrics.length === 0) return
    let idx = -1
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) { idx = i; break }
    }
    setActiveLyricIndex(idx)
    if (idx >= 0 && lyricsRef.current) {
      const container = lyricsRef.current
      const el = container.querySelector(`[data-lyric-idx="${idx}"]`) as HTMLElement
      if (el) {
        container.scrollTo({
          top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
          behavior: "smooth",
        })
      }
    }
  }, [currentTime, currentSong])

  // ── Drag handlers ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (mode !== "collapsed") return
    e.preventDefault()
    setDragging(true)
    setHasMoved(false)
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      px: pos.x,
      py: pos.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [mode, pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) setHasMoved(true)

    const w = window.innerWidth
    const h = window.innerHeight
    const btnSize = 56
    const margin = 24

    // Calculate position from drag start
    let newX = dragStart.current.px + dx
    let newY = dragStart.current.py + dy

    // Clamp within viewport
    const maxX = w - btnSize - margin
    const maxY = h - btnSize - margin
    newX = Math.max(-maxX, Math.min(maxX, newX))
    newY = Math.max(-maxY, Math.min(maxY, newY))

    setPos({ x: newX, y: newY })
  }, [dragging])

  const snapToCorner = useCallback(() => {
    if (!hasMoved) {
      setDragging(false)
      return
    }
    const w = window.innerWidth
    const h = window.innerHeight
    const btnSize = 56
    const margin = 24

    // Current center position
    const cx = w / 2 + pos.x
    const cy = h / 2 + pos.y

    // Four corners
    const corners = [
      { name: "tl", x: margin, y: margin },
      { name: "tr", x: w - btnSize - margin, y: margin },
      { name: "bl", x: margin, y: h - btnSize - margin },
      { name: "br", x: w - btnSize - margin, y: h - btnSize - margin },
    ]

    // Find nearest corner
    let nearest = corners[0]
    let minDist = Infinity
    for (const c of corners) {
      const dist = Math.hypot(cx - (c.x + btnSize / 2), cy - (c.y + btnSize / 2))
      if (dist < minDist) { minDist = dist; nearest = c }
    }

    // Set position relative to center
    setPos({
      x: nearest.x - w / 2 + btnSize / 2,
      y: nearest.y - h / 2 + btnSize / 2,
    })
    setDragging(false)
  }, [hasMoved, pos])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    snapToCorner()
  }, [dragging, snapToCorner])

  // ── Audio handlers ──
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.pause()
    else audio.play().catch(() => {})
  }, [isPlaying])

  const nextSong = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % songs.length)
    setIsPlaying(true)
  }, [songs.length])

  const prevSong = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + songs.length) % songs.length)
    setIsPlaying(true)
  }, [songs.length])

  // ── Progress bar drag support ──
  const seekBarRef = useRef<HTMLDivElement>(null)
  const [seeking, setSeeking] = useState(false)

  const seekToX = useCallback((clientX: number) => {
    const audio = audioRef.current
    const bar = seekBarRef.current
    if (!audio || !duration || !bar) return
    const rect = bar.getBoundingClientRect()
    const pct = (clientX - rect.left) / rect.width
    audio.currentTime = Math.max(0, Math.min(1, pct)) * duration
    setCurrentTime(audio.currentTime)
  }, [duration])

  const onSeekBarPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    setSeeking(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    seekToX(e.clientX)
  }, [seekToX])

  const onSeekBarPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!seeking) return
    seekToX(e.clientX)
  }, [seeking, seekToX])

  const onSeekBarPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!seeking) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    setSeeking(false)
  }, [seeking])

  const cycleLoop = () => setLoop((l) => (l === "none" ? "all" : l === "all" ? "one" : "none"))

  const playSongAt = (idx: number) => {
    setCurrentIndex(idx)
    setIsPlaying(true)
  }

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.82)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.50)",
    boxShadow: "0 8px 32px rgba(90, 80, 160, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
  }

  // ── Shared sub-components with warm color scheme ──
  const A = "var(--m-accent)"
  const AD = "var(--m-accent-dark)"
  const AL = "var(--m-accent-light)"

  const vinylRecord = (size: string) => (
    <div className={`relative ${size}`}>
      <div className="absolute -inset-2 rounded-full opacity-25 blur-lg" style={{ background: A }} />
      <div
        className={`relative h-full w-full rounded-full ${isPlaying ? "animate-spin" : ""}`}
        style={{
          background: `conic-gradient(from 0deg, ${A}, ${AD}, ${A}, ${AD}, ${A})`,
          animationDuration: "8s",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        }}
      >
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background: "repeating-radial-gradient(circle, transparent 0, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bg-card-solid)" }}>
            <div className="h-3 w-3 rounded-full" style={{ background: A }} />
          </div>
        </div>
      </div>
    </div>
  )

  const progressBar = () => (
    <div className="w-full">
      <div
        ref={seekBarRef}
        className="group relative h-1.5 cursor-pointer touch-none rounded-full"
        style={{ background: "rgba(0,0,0,0.06)" }}
        onPointerDown={onSeekBarPointerDown}
        onPointerMove={onSeekBarPointerMove}
        onPointerUp={onSeekBarPointerUp}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, background: `linear-gradient(90deg, ${A}, ${AD})` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-transform group-hover:scale-125"
          style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, marginLeft: "-6px", background: A, boxShadow: "0 1px 6px rgba(0,0,0,0.15)" }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[0.65rem] tabular-nums" style={{ color: "var(--m-text-muted)" }}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )

  const controlButtons = (compact = false) => (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-4"}`}>
      <button
        onClick={cycleLoop}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${loop !== "none" ? "" : "hover:opacity-80"}`}
        style={{ color: loop !== "none" ? A : "var(--m-text-muted)" }}
      >
        {loop === "one" ? <Repeat1 size={15} /> : <Repeat size={15} />}
      </button>
      <button onClick={prevSong} className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70" style={{ color: "var(--m-text)" }}>
        <SkipBack size={16} fill="currentColor" />
      </button>
      <button
        onClick={togglePlay}
        className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105"
        style={{ background: `linear-gradient(135deg, ${A}, ${AD})`, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
      >
        {isPlaying ? <Pause size={20} className="text-white" fill="white" /> : <Play size={20} className="text-white ml-0.5" fill="white" />}
      </button>
      <button onClick={nextSong} className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70" style={{ color: "var(--m-text)" }}>
        <SkipForward size={16} fill="currentColor" />
      </button>
      <button onClick={() => setMuted((m) => !m)} className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80" style={{ color: "var(--m-text-muted)" }}>
        {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  )

  // Calculate button position from center
  const btnLeft = `calc(50vw + ${pos.x}px)`
  const btnTop = `calc(50vh + ${pos.y}px)`
  const btnTransform = "translate(-50%, -50%)"

  // Determine which corner for compact card positioning
  const isLeft = pos.x < 0
  const isTop = pos.y < 0
  // Use fixed corner-based positioning to avoid off-screen cards
  const compactStyle: React.CSSProperties = isLeft
    ? { left: "24px" }
    : { right: "24px" }
  if (isTop) {
    compactStyle.top = "80px"
  } else {
    compactStyle.bottom = "80px"
  }

  return (
    <>
      {/* ── Local CSS variables for music player color scheme ── */}
      <style>{`
        :root {
          --m-accent: ${MUSIC.accent};
          --m-accent-dark: ${MUSIC.accentDark};
          --m-accent-light: ${MUSIC.accentLight};
          --m-text: ${MUSIC.text};
          --m-text-light: ${MUSIC.textLight};
          --m-text-muted: ${MUSIC.textMuted};
        }
        .dark {
          --m-accent: ${MUSIC.accentD};
          --m-accent-dark: ${MUSIC.accentDarkD};
          --m-accent-light: ${MUSIC.accentLightD};
          --m-text: ${MUSIC.textD};
          --m-text-light: ${MUSIC.textLightD};
          --m-text-muted: ${MUSIC.textMutedD};
        }
        @keyframes eqBar {
          0% { height: 3px; }
          100% { height: 12px; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--m-accent);
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--m-accent);
          cursor: pointer;
          border: none;
        }
      `}</style>

      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        preload="metadata"
        onError={(e) => console.error("[MusicPlayer] Audio error:", e.currentTarget.error, "src:", currentSong.audioUrl)}
      />

      {/* ── Collapsed: draggable floating button ── */}
      {mode === "collapsed" && (
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => { if (!hasMoved) setMode("compact") }}
          className="fixed z-50 flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full transition-shadow active:cursor-grabbing"
          style={{
            left: btnLeft,
            top: btnTop,
            transform: btnTransform,
            ...cardStyle,
            transition: dragging ? "none" : "left 0.3s cubic-bezier(0.4,0,0.2,1), top 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
          aria-label="打开音乐播放器（可拖动）"
        >
          {isPlaying ? (
            <span className="flex h-5 items-end gap-0.5">
              {[0, 1, 2].map((b) => (
                <span key={b} className="w-1 rounded-full" style={{ background: A, animation: `eqBar 0.6s ease-in-out ${b * 0.15}s infinite alternate` }} />
              ))}
            </span>
          ) : (
            <Music size={22} style={{ color: A }} />
          )}
        </button>
      )}

      {/* ── Compact: player card ── */}
      {mode === "compact" && (
        <div
          className="fixed z-50 w-[320px] rounded-3xl px-5 py-5"
          style={{
            ...compactStyle,
            ...cardStyle,
          }}
        >
          <div className="flex items-center gap-3">
            {vinylRecord("h-16 w-16 shrink-0")}
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-bold" style={{ color: "var(--m-text)" }}>{currentSong.title}</div>
              <div className="truncate text-xs" style={{ color: "var(--m-text-light)" }}>{currentSong.artist}</div>
            </div>
            <button onClick={() => setMode("expanded")} className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-70" style={{ color: "var(--m-text-muted)" }} aria-label="展开大面板">
              <Maximize2 size={15} />
            </button>
            <button onClick={() => setMode("collapsed")} className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-70" style={{ color: "var(--m-text-muted)" }} aria-label="收起">
              <X size={16} />
            </button>
          </div>
          <div className="mt-4">{progressBar()}</div>
          <div className="mt-3 flex justify-center">{controlButtons(true)}</div>
        </div>
      )}

      {/* ── Expanded: full overlay panel ── */}
      {mode === "expanded" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setMode("compact")}>
          <div className="flex max-h-[85vh] w-[min(680px,90vw)] flex-col overflow-hidden rounded-3xl md:flex-row" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            {/* Left: player controls */}
            <div className="relative flex flex-col items-center px-6 py-8 md:w-[300px] md:shrink-0">
              <div className="absolute right-4 top-4 flex gap-1">
                <button onClick={() => setMode("compact")} className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-70" style={{ color: "var(--m-text-muted)" }} aria-label="收起为大卡片">
                  <Minimize2 size={15} />
                </button>
                <button onClick={() => setMode("collapsed")} className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-70" style={{ color: "var(--m-text-muted)" }} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>

              {vinylRecord("h-36 w-36 md:h-40 md:w-40")}
              <div className="mt-3 text-center">
                <h2 className="text-base font-bold" style={{ color: "var(--m-text)" }}>{currentSong.title}</h2>
                <p className="mt-0.5 text-xs" style={{ color: "var(--m-text-light)" }}>{currentSong.artist}</p>
              </div>
              <div className="mt-5 w-full">{progressBar()}</div>
              <div className="mt-4">{controlButtons()}</div>
              <div className="mt-3 flex w-28 items-center">
                <input
                  type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
                  onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full"
                  style={{ background: `linear-gradient(90deg, ${A} ${(muted ? 0 : volume) * 100}%, rgba(0,0,0,0.08) ${(muted ? 0 : volume) * 100}%)` }}
                />
              </div>
            </div>

            {/* Right: tabs */}
            <div className="flex flex-1 flex-col overflow-hidden border-t md:border-l md:border-t-0" style={{ borderColor: "var(--glass-border)" }}>
              <div className="flex gap-2 p-4">
                <button
                  onClick={() => setActiveTab("lyrics")}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                  style={activeTab === "lyrics" ? { background: A, color: "white" } : { border: "1px solid var(--glass-border)", color: "var(--m-text-light)" }}
                >
                  歌词
                </button>
                <button
                  onClick={() => setActiveTab("playlist")}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                  style={activeTab === "playlist" ? { background: A, color: "white" } : { border: "1px solid var(--glass-border)", color: "var(--m-text-light)" }}
                >
                  歌单
                </button>
              </div>

              <div className="flex-1 px-4 pb-4" style={{ minHeight: "260px" }}>
                {activeTab === "lyrics" && (
                  <div
                    ref={lyricsRef}
                    className="h-[300px] overflow-y-auto rounded-2xl px-4 py-4"
                    style={{ maskImage: "linear-gradient(180deg, transparent 0%, black 15%, black 85%, transparent 100%)" }}
                  >
                    {currentSong.lyrics.map((line, i) => (
                      <div
                        key={i}
                        data-lyric-idx={i}
                        className="py-2 text-center text-sm transition-all duration-300"
                        style={{ color: activeLyricIndex === i ? A : "var(--m-text-muted)", fontWeight: activeLyricIndex === i ? 700 : 400 }}
                      >
                        {line.text || "\u00A0"}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "playlist" && (
                  <div className="h-[300px] space-y-1.5 overflow-y-auto">
                    {songs.map((song, idx) => (
                      <button
                        key={song.id}
                        onClick={() => playSongAt(idx)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:opacity-90"
                        style={idx === currentIndex ? { background: AL, color: A } : { color: "var(--m-text)" }}
                      >
                        <span className="w-6 text-center text-xs tabular-nums" style={{ color: "var(--m-text-muted)" }}>
                          {idx === currentIndex && isPlaying ? (
                            <span className="flex h-3 items-end gap-0.5">
                              {[0, 1].map((b) => (
                                <span key={b} className="w-0.5 rounded-full" style={{ background: A, animation: `eqBar 0.6s ease-in-out ${b * 0.1}s infinite alternate` }} />
                              ))}
                            </span>
                          ) : (idx + 1)}
                        </span>
                        <div className="flex-1 overflow-hidden">
                          <div className="truncate text-sm font-medium">{song.title}</div>
                          <div className="truncate text-xs" style={{ color: "var(--m-text-muted)" }}>{song.artist}</div>
                        </div>
                        {idx === currentIndex && <Music size={14} className="shrink-0" style={{ color: A }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
