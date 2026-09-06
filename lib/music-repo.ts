import { GITHUB_CONFIG, githubApiUrl } from "@/lib/github-config"
import type { Song } from "@/lib/music-config"

/* ============================================================
 * 音乐入库工具：
 * 1. 通过 Meting 公共实例解析网易云歌曲 id（歌名/歌手/音源直链）
 * 2. 下载音源（直连失败时自动尝试公共跨域代理）
 * 3. 通过 GitHub Contents API 提交：音源 → public/audio/，歌单 → data/playlist.json + public/data/（线上副本，供 APP 同步拉取）
 *    提交后由 .github/workflows/deploy.yml 自动构建部署（约 1-2 分钟生效）
 * ============================================================ */

// Meting 公共解析实例，若失效可替换为其他实例
const METING_API = "https://api.injahow.cn/meting/"

export interface ResolvedSong {
  title: string
  artist: string
  audioUrl: string // 远端音源直链（已升级为 https）
  ext: string // 音源扩展名，如 mp3 / flac / m4a
}

/** 从输入中提取网易云歌曲 id：支持纯数字 id 或完整歌曲链接（含分享链接） */
export function extractSongId(input: string): string {
  const raw = input.trim()
  if (/^\d+$/.test(raw)) return raw
  if (/song\?id=(\d+)/.test(raw)) return raw.match(/song\?id=(\d+)/)![1]
  // 常见非歌曲页面，给出针对性提示
  if (/artist\?id=\d+/.test(raw)) throw new Error("这是歌手主页链接，请打开具体歌曲页面，复制歌曲链接或分享链接后再试")
  if (/album\?id=\d+/.test(raw)) throw new Error("这是专辑页面链接，请打开具体歌曲页面，复制歌曲链接或分享链接后再试")
  if (/playlist\?id=\d+/.test(raw)) throw new Error("这是歌单页面链接，请打开具体歌曲页面，复制歌曲链接或分享链接后再试")
  if (/^https?:\/\//i.test(raw)) throw new Error("无法从该链接中识别歌曲 id，请粘贴歌曲页面链接或直接输入数字 id")
  throw new Error("请输入数字歌曲 id 或歌曲链接")
}

/** 解析网易云歌曲 id */
export async function resolveNeteaseSong(id: string): Promise<ResolvedSong> {
  const songId = extractSongId(id)
  let res: Response
  try {
    res = await fetch(`${METING_API}?type=song&id=${encodeURIComponent(songId)}`)
  } catch {
    throw new Error("解析服务连接失败，请稍后重试或改用「上传音源文件」")
  }
  if (!res.ok) throw new Error(`解析服务请求失败（HTTP ${res.status}）`)

  let data: Array<{ name?: string; artist?: string; url?: string }>
  try {
    data = await res.json()
  } catch {
    throw new Error("解析服务返回异常，可更换 METING_API 实例或改用「上传音源文件」")
  }
  const info = Array.isArray(data) ? data[0] : undefined
  if (!info?.url) throw new Error("未解析到该歌曲（id 不存在或音源受版权保护），可改用「上传音源文件」")

  const audioUrl = String(info.url).replace(/^http:/, "https:")
  const extMatch = audioUrl.split(/[?#]/)[0].match(/\.(\w{2,5})$/)
  return {
    title: String(info.name ?? "").trim(),
    artist: String(info.artist ?? "").trim(),
    audioUrl,
    ext: extMatch ? extMatch[1].toLowerCase() : "mp3",
  }
}

// 依次尝试的音源下载通道：直连 → 公共跨域代理
const AUDIO_FETCHERS: Array<(url: string) => string> = [
  (url) => url,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

/** 下载远端音源为 Blob（含体积校验） */
export async function downloadAudio(remoteUrl: string): Promise<Blob> {
  let lastReason = ""
  for (const wrap of AUDIO_FETCHERS) {
    try {
      const res = await fetch(wrap(remoteUrl))
      if (!res.ok) {
        lastReason = `HTTP ${res.status}`
        continue
      }
      const blob = await res.blob()
      if (blob.size < 100 * 1024) {
        lastReason = "返回内容不是有效音源"
        continue
      }
      if (blob.size > 60 * 1024 * 1024) {
        throw new Error("音源超过 60MB，超出 GitHub 提交限制")
      }
      return blob
    } catch (e) {
      lastReason = e instanceof Error ? e.message : String(e)
    }
  }
  throw new Error(`音源下载失败（${lastReason}），可能受版权保护，请手动下载后用「上传音源文件」添加`)
}

// ── GitHub Contents API 基础操作 ──

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${GITHUB_CONFIG.token}`,
    Accept: "application/vnd.github+json",
  }
}

function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ""))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder("utf-8").decode(bytes)
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(blob)
  })
}

/** 读取仓库文件信息（内容 + sha），不存在时返回 undefined */
async function getRepoFile(path: string): Promise<{ content: string; sha: string } | undefined> {
  const res = await fetch(`${githubApiUrl(path)}?ref=${GITHUB_CONFIG.branch}`, {
    headers: authHeaders(),
  })
  if (res.status === 404) return undefined
  if (!res.ok) throw new Error(`读取仓库文件失败（HTTP ${res.status}）`)
  const json = await res.json()
  return { content: json.content, sha: json.sha }
}

/** 创建或更新仓库文件（已存在时自动携带 sha 覆盖） */
async function putRepoFile(path: string, base64: string, message: string, sha?: string): Promise<void> {
  const finalSha = sha ?? (await getRepoFile(path))?.sha
  const res = await fetch(githubApiUrl(path), {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: base64,
      branch: GITHUB_CONFIG.branch,
      ...(finalSha ? { sha: finalSha } : {}),
    }),
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      msg = (await res.json()).message ?? msg
    } catch {}
    throw new Error(`提交到 GitHub 失败：${msg}`)
  }
}

/** 读取远端歌单（以仓库最新内容为准，而非构建时打包的旧数据） */
async function fetchPlaylistFromRepo(): Promise<{ songs: Song[]; sha?: string }> {
  const file = await getRepoFile("data/playlist.json")
  if (!file) return { songs: [] }
  return { songs: JSON.parse(decodeBase64Utf8(file.content)) as Song[], sha: file.sha }
}

export interface AddSongInput {
  id: string // 歌曲 id（网易云 id 或自动生成）
  title: string
  artist: string
  audio: Blob
  ext: string // mp3 / m4a / flac ...
}

/** 将新歌提交到仓库：先传音源，再追加歌单，两次提交由 Actions 自动部署 */
export async function addSongToRepo(input: AddSongInput): Promise<Song> {
  if (!GITHUB_CONFIG.token) {
    throw new Error("未配置 GitHub Token，请检查 NEXT_PUBLIC_GH_TOKEN 配置")
  }

  // id 仅保留安全文件名字符，防止链接等输入破坏 API 路径
  const safeId = input.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64)
  if (!safeId) throw new Error("歌曲 id 无效")
  const safeExt = (input.ext || "mp3").replace(/[^a-z0-9]/gi, "").slice(0, 5)
  const filename = `${safeId}.${safeExt}`
  const commitMsg = `add song: ${input.title} - ${input.artist}`

  // 1. 上传音源
  await putRepoFile(`public/audio/${filename}`, await blobToBase64(input.audio), commitMsg)

  // 2. 追加歌单
  const { songs, sha } = await fetchPlaylistFromRepo()
  if (songs.some((s) => s.id === safeId)) {
    throw new Error("歌单中已存在相同 id 的歌曲")
  }
  const newSong: Song = {
    id: safeId,
    title: input.title,
    artist: input.artist,
    audioUrl: `/audio/${filename}`,
    lyrics: [],
  }
  const updated = JSON.stringify([...songs, newSong], null, 2) + "\n"
  await putRepoFile("data/playlist.json", encodeBase64Utf8(updated), commitMsg, sha)
  // 线上副本：public/ 随静态导出部署，Sisyphus APP 同步功能拉取该端点
  await putRepoFile("public/data/playlist.json", encodeBase64Utf8(updated), commitMsg)

  return newSong
}
