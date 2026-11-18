/* ============================================================
 * GitHub 仓库写入配置（Moment 上传 / 音乐添加 / 博客编辑共用）
 *
 * Token 解析顺序：
 *  1. 浏览器 localStorage 中的自定义 token（网页「Token 设置」入口写入）
 *  2. 构建时注入的 NEXT_PUBLIC_GH_TOKEN（兜底）
 *
 * 内置 token 通过环境变量注入（构建时内联）：
 *  - 本地开发/构建：写在 .env.local（已被 .gitignore 忽略，不会提交）
 *  - 线上部署：在仓库 Settings → Secrets and variables → Actions
 *    添加同名 Secret，deploy.yml 构建时注入
 *
 * Fine-grained Token 权限：仅授权本仓库，Contents: Read and write
 * ============================================================ */

export const GITHUB_CONFIG = {
  owner: "EthanWangHaven",
  repo: "EthanWangHaven.github.io",
  branch: "main",
}

const BUILTIN_TOKEN = process.env.NEXT_PUBLIC_GH_TOKEN ?? ""
const CUSTOM_TOKEN_KEY = "ethanwang:gh-token"

export type TokenSource = "custom" | "builtin" | "none"

export interface TokenStatus {
  source: TokenSource
  masked: string // 仅自定义 token 返回掩码，内置 token 不回显
}

function readStorage(key: string): string {
  if (typeof window === "undefined") return ""
  try {
    return window.localStorage.getItem(key) ?? ""
  } catch {
    return ""
  }
}

function writeStorage(key: string, value: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {}
}

export function getCustomToken(): string {
  return readStorage(CUSTOM_TOKEN_KEY).trim()
}

export function setCustomToken(token: string): void {
  writeStorage(CUSTOM_TOKEN_KEY, token.trim())
}

export function clearCustomToken(): void {
  writeStorage(CUSTOM_TOKEN_KEY, null)
}

/** 实际用于 GitHub API 的 token：自定义优先，回落到构建内置 */
export function getGithubToken(): string {
  return getCustomToken() || BUILTIN_TOKEN
}

export function getTokenStatus(): TokenStatus {
  const custom = getCustomToken()
  if (custom) return { source: "custom", masked: maskToken(custom) }
  if (BUILTIN_TOKEN) return { source: "builtin", masked: "" }
  return { source: "none", masked: "" }
}

/** 只露头尾，避免完整 token 暴露在界面上：ghp_abcd…wxyz */
export function maskToken(token: string): string {
  if (token.length <= 12) return `${token.slice(0, 4)}…`
  return `${token.slice(0, 8)}…${token.slice(-4)}`
}

/** 校验 token 是否有效且对本仓库有写权限 */
export async function validateGithubToken(token: string): Promise<{ login?: string }> {
  let res: Response
  try {
    res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: "application/vnd.github+json",
      },
    })
  } catch {
    throw new Error("网络连接失败，请检查网络后重试")
  }
  if (res.status === 401) throw new Error("Token 无效或已过期")
  if (res.status === 404) throw new Error("Token 无权访问该仓库，请确认已勾选 repo 权限")
  if (!res.ok) throw new Error(`校验失败（HTTP ${res.status}）`)

  let data: { owner?: { login?: string }; permissions?: { push?: boolean } } = {}
  try {
    data = await res.json()
  } catch {}
  if (data.permissions?.push === false) {
    throw new Error("Token 没有写入权限，请确认已勾选 repo 权限")
  }
  return { login: data.owner?.login }
}

export function githubApiUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`
}
