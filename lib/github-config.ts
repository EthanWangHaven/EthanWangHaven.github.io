/* ============================================================
 * GitHub 仓库写入配置（Moment 上传 / 音乐添加共用）
 * 需要 GitHub Fine-grained Token，权限勾选 Contents: Read and write
 * ============================================================ */

export const GITHUB_CONFIG = {
  token: "", // 在此填入你的 GitHub Fine-grained Token
  owner: "EthanWangHaven",
  repo: "EthanWangHaven.github.io",
  branch: "main",
}

export function githubApiUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`
}
