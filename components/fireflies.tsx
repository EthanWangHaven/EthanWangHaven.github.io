"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  phase: number
  phaseSpeed: number
  hue: number
}

export function Fireflies({ count = 40 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()
  const rafRef = useRef<number>(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || !resolvedTheme) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isDark = resolvedTheme === "dark"

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const particles: Particle[] = []
    const lightCount = Math.floor(count * 0.7)
    const actualCount = isDark ? count : lightCount

    for (let i = 0; i < actualCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: isDark
          ? Math.random() * 2.5 + 0.8
          : Math.random() * 2.2 + 1.0,
        opacity: isDark
          ? Math.random() * 0.6 + 0.2
          : Math.random() * 0.5 + 0.3,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.008,
        hue: isDark
          ? 45 + Math.random() * 15
          : 220 + Math.random() * 40,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.phase += p.phaseSpeed

        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        p.vy += (Math.random() - 0.5) * 0.005
        p.vy = Math.max(-0.6, Math.min(0.6, p.vy))

        const flicker = (Math.sin(p.phase) + 1) / 2
        const alpha = p.opacity * (0.3 + flicker * 0.7)
        const glowSize = p.size * (2.5 + flicker * 2)

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize)
        if (isDark) {
          gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`)
          gradient.addColorStop(0.4, `hsla(${p.hue}, 90%, 60%, ${alpha * 0.4})`)
          gradient.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`)
        } else {
          gradient.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${alpha * 0.9})`)
          gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 60%, ${alpha * 0.4})`)
          gradient.addColorStop(1, `hsla(${p.hue}, 60%, 55%, 0)`)
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = isDark
          ? `hsla(${p.hue}, 100%, 85%, ${alpha})`
          : `hsla(${p.hue}, 85%, 70%, ${alpha * 0.7})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [resolvedTheme, count, mounted])

  // Always render canvas after mount; before mount return null to avoid hydration mismatch
  if (!mounted) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  )
}
