"use client"

import { useState, useEffect, useRef } from "react"

export function Typewriter({
  text,
  speed = 70,
  delay = 300,
  className,
}: {
  text: string
  speed?: number
  delay?: number
  className?: string
}) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDisplayed("")
    setDone(false)

    const startTimer = setTimeout(() => {
      let i = 0
      const tick = () => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1))
          i++
          timerRef.current = setTimeout(tick, speed)
        } else {
          setDone(true)
        }
      }
      tick()
    }, delay)

    return () => {
      clearTimeout(startTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, speed, delay])

  return (
    <span className={className}>
      {displayed}
      <span
        className={`inline-block w-0.5 h-[1em] -mb-[0.15em] ml-0.5 ${
          done ? "animate-pulse" : ""
        }`}
        style={{ background: "var(--accent)" }}
      />
    </span>
  )
}
