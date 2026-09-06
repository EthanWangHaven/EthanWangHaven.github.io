import playlistData from "@/data/playlist.json"

export interface LyricLine {
  time: number // seconds
  text: string
}

export interface Song {
  id: string
  title: string
  artist: string
  audioUrl: string
  cover?: string
  lyrics: LyricLine[]
}

// 歌单数据存储在 data/playlist.json（线上可通过 GitHub API 追加新歌）
export const playlist: Song[] = playlistData as Song[]
