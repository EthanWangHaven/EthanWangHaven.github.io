import { MusicPlayer } from "@/components/music-player"

export const metadata = {
  title: "云猫乐库",
  description: "音乐纯粹，爱V绝对",
}

export default function MusicPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">云猫乐库</h1>
        <p className="mt-2 text-base text-[var(--text-light)] md:text-lg">
          音乐纯粹，爱V绝对
        </p>
      </div>
      <MusicPlayer />
    </div>
  )
}
