import { getAllMoments } from "@/lib/moments"
import { MapPin, Calendar } from "lucide-react"

export const metadata = {
  title: "Moments",
  description: "生活瞬间",
}

export default function MomentsPage() {
  const moments = getAllMoments()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">Moments</h1>
      <p className="mb-8 text-sm text-[var(--text-light)]">
        记录生活中的美好瞬间
      </p>

      {moments.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {moments.map((moment, idx) => (
            <div
              key={moment.slug}
              className="group overflow-hidden rounded-[var(--radius)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow)",
              }}
            >
              {/* Cover image */}
              {moment.cover && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={moment.cover}
                    alt={moment.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <h3 className="mb-2 font-bold leading-snug transition-colors group-hover:text-[var(--accent)]">
                  {moment.title}
                </h3>

                {moment.description && (
                  <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[var(--text-light)]">
                    {moment.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(moment.date).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {moment.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {moment.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-[var(--radius)] p-12 text-center text-[var(--text-muted)]"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow)",
          }}
        >
          还没有 Moments
        </div>
      )}
    </div>
  )
}
