"use client"

import { useEffect, useState, useMemo } from "react"
import { Clock, BarChart3, Calendar, CloudSun, Droplets, Wind, Thermometer } from "lucide-react"

/* ============================================================
 * Home Widgets: 时钟 · 站点统计 · 日历 · 天气
 * 毛玻璃风格 · 深色模式适配 · 纯客户端组件
 * ============================================================ */

export function HomeWidgets({
  postsCount,
  momentsCount,
  lastUpdate,
}: {
  postsCount: number
  momentsCount: number
  lastUpdate: string
}) {
  return (
    <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ClockCard />
      <StatsCard postsCount={postsCount} momentsCount={momentsCount} lastUpdate={lastUpdate} />
      <CalendarCard />
      <WeatherCard />
    </div>
  )
}

/* ── 毛玻璃卡片容器 ── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius)] p-5 ${className}`}
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow)",
      }}
    >
      {children}
    </div>
  )
}

/* ── 卡片标题 ── */
function CardTitle({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={16} className="text-[var(--accent)]" />
      <span className="text-xs font-medium text-[var(--text-light)]">{children}</span>
    </div>
  )
}

/* ============================================================
 * 1. 时钟卡片
 * ============================================================ */
function ClockCard() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return (
      <GlassCard className="flex flex-col items-center justify-center">
        <CardTitle icon={Clock}>当前时间</CardTitle>
        <div className="text-3xl font-bold tabular-nums tracking-tight opacity-40">
          --:--<span className="text-[var(--text-muted)]">:--</span>
        </div>
        <div className="mt-1.5 text-xs text-[var(--text-light)]">&nbsp;</div>
      </GlassCard>
    )
  }

  const hh = String(time.getHours()).padStart(2, "0")
  const mm = String(time.getMinutes()).padStart(2, "0")
  const ss = String(time.getSeconds()).padStart(2, "0")
  const dateStr = `${time.getFullYear()}年${time.getMonth() + 1}月${time.getDate()}日`
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  const week = weekDays[time.getDay()]

  return (
    <GlassCard className="flex flex-col items-center justify-center">
      <CardTitle icon={Clock}>当前时间</CardTitle>
      <div className="text-3xl font-bold tabular-nums tracking-tight">
        {hh}<span className="animate-pulse">:</span>{mm}<span className="text-[var(--text-muted)]">:{ss}</span>
      </div>
      <div className="mt-1.5 text-xs text-[var(--text-light)]">
        {dateStr} · {week}
      </div>
    </GlassCard>
  )
}

/* ============================================================
 * 2. 站点统计卡片
 * ============================================================ */
function StatsCard({ postsCount, momentsCount, lastUpdate }: { postsCount: number; momentsCount: number; lastUpdate: string }) {
  const [days, setDays] = useState(0)

  useEffect(() => {
    // 站点起始日期，可按需修改
    const startDate = new Date("2026-06-01")
    const diff = Math.floor((Date.now() - startDate.getTime()) / 86400000)
    setDays(Math.max(0, diff))
  }, [])

  return (
    <GlassCard className="flex flex-col justify-center">
      <CardTitle icon={BarChart3}>站点统计</CardTitle>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-light)]">📝 运行天数</span>
          <span className="text-sm font-bold tabular-nums">{days} 天</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-light)]">📊 文章数量</span>
          <span className="text-sm font-bold tabular-nums">{postsCount} 篇</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-light)]">💬 说说数量</span>
          <span className="text-sm font-bold tabular-nums">{momentsCount} 条</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-light)]">🔄 最后更新</span>
          <span className="text-sm font-bold tabular-nums">{lastUpdate}</span>
        </div>
      </div>
    </GlassCard>
  )
}

/* ============================================================
 * 3. 日历卡片
 * ============================================================ */
function CalendarCard() {
  const [current, setCurrent] = useState(new Date())

  const year = current.getFullYear()
  const month = current.getMonth()
  const today = new Date()

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const weekHeaders = ["日", "一", "二", "三", "四", "五", "六"]

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const arr: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) arr.push(null)
    for (let i = 1; i <= daysInMonth; i++) arr.push(i)
    return arr
  }, [year, month])

  const isToday = (day: number | null) =>
    day !== null &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))

  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle icon={Calendar}>{year}年{monthNames[month]}</CardTitle>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]" aria-label="上个月">
            ‹
          </button>
          <button onClick={nextMonth} className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]" aria-label="下个月">
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekHeaders.map((w) => (
          <div key={w} className="text-[0.6rem] font-medium text-[var(--text-muted)]">{w}</div>
        ))}
        {days.map((day, i) => (
          <div
            key={i}
            className={`flex h-6 items-center justify-center rounded text-[0.65rem] tabular-nums ${
              isToday(day)
                ? "bg-[var(--accent)] font-bold text-white"
                : day !== null
                ? "text-[var(--text)] hover:bg-[var(--accent-light)]"
                : ""
            }`}
          >
            {day !== null ? day : ""}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ── 天气代码转图标 ── */
function weatherIcon(code: string): string {
  const c = parseInt(code)
  if ([113].includes(c)) return "☀️"
  if ([116].includes(c)) return "⛅"
  if ([119,122,143,248,260].includes(c)) return "☁️"
  if ([179,182,185,281,284,311,314,317,350,353,356,359,362,365,368,371,374,377,392,395].includes(c)) return "🌧️"
  if ([200,386,389].includes(c)) return "⛈️"
  if ([227,230,320,323,326,329,332,335,338,341,344,377].includes(c)) return "🌨️"
  if ([368,371,392,395].includes(c)) return "❄️"
  if ([230,248].includes(c)) return "🌫️"
  return "🌤️"
}

/* ============================================================
 * 4. 天气卡片
 * ============================================================ */
interface HourlyData {
  time: string
  temp: number
  icon: string
}

function WeatherCard() {
  const [weather, setWeather] = useState<{
    temp: number; feels: number; text: string; humidity: number; wind: number
  } | null>(null)
  const [hourly, setHourly] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // 上海天气，wttr.in 免费API
    fetch("https://wttr.in/Shanghai?format=j1&lang=zh")
      .then((res) => res.json())
      .then((data) => {
        const current = data.current_condition?.[0]
        if (current) {
          setWeather({
            temp: parseInt(current.temp_C),
            feels: parseInt(current.FeelsLikeC),
            text: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || "未知",
            humidity: parseInt(current.humidity),
            wind: parseInt(current.windspeedKmph),
          })
        }
        // 逐小时预报：取今天的剩余时段 + 明天前几小时
        const now = new Date()
        const currentHour = now.getHours()
        const hourlyArr: HourlyData[] = []
        const today = data.weather?.[0]
        const tomorrow = data.weather?.[1]
        if (today?.hourly) {
          today.hourly.forEach((h: { time: string; tempC: string; weatherCode: string }, i: number) => {
            const hNum = parseInt(h.time) / 100
            if (hNum >= currentHour && hourlyArr.length < 4) {
              hourlyArr.push({
                time: String(hNum).padStart(2, "0") + ":00",
                temp: parseInt(h.tempC),
                icon: weatherIcon(h.weatherCode),
              })
            }
          })
        }
        if (tomorrow?.hourly && hourlyArr.length < 4) {
          tomorrow.hourly.forEach((h: { time: string; tempC: string; weatherCode: string }) => {
            if (hourlyArr.length >= 4) return
            const hNum = parseInt(h.time) / 100
            hourlyArr.push({
              time: String(hNum).padStart(2, "0") + ":00",
              temp: parseInt(h.tempC),
              icon: weatherIcon(h.weatherCode),
            })
          })
        }
        setHourly(hourlyArr)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  return (
    <GlassCard className="flex flex-col">
      <CardTitle icon={CloudSun}>上海天气</CardTitle>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
          获取中...
        </div>
      ) : error ? (
        <div className="text-sm text-[var(--text-muted)]">
          天气获取失败
        </div>
      ) : weather ? (
        <div>
          {/* 当前温度 + 天气描述 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold tabular-nums">{weather.temp}°C</div>
              <div className="text-xs text-[var(--text-light)]">{weather.text}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--text-muted)]">体感 {weather.feels}°</div>
            </div>
          </div>

          {/* 体感 / 湿度 / 风速 一排 */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-2" style={{ borderColor: "var(--glass-border)" }}>
            <div className="flex items-center gap-1">
              <Thermometer size={11} className="text-[var(--accent)]" />
              <span className="text-[0.65rem] tabular-nums">{weather.feels}°</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={11} className="text-[var(--accent)]" />
              <span className="text-[0.65rem] tabular-nums">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind size={11} className="text-[var(--accent)]" />
              <span className="text-[0.65rem] tabular-nums">{weather.wind}km/h</span>
            </div>
          </div>

          {/* 逐小时预报 */}
          {hourly.length > 0 && (
            <div className="mt-3 border-t pt-2" style={{ borderColor: "var(--glass-border)" }}>
              <div className="flex justify-between">
                {hourly.map((h, i) => (
                  <div key={i} className="flex min-w-[2.2rem] flex-col items-center gap-0.5">
                    <span className="text-[0.55rem] text-[var(--text-muted)]">{h.time}</span>
                    <span className="text-sm">{h.icon}</span>
                    <span className="text-[0.65rem] font-medium tabular-nums">{h.temp}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </GlassCard>
  )
}
