/* ============================================================
 * GitHub 仓库写入配置（Moment 上传 / 音乐添加共用）
 *
 * Token 通过环境变量 NEXT_PUBLIC_GH_TOKEN 注入（构建时内联）：
 *  - 本地开发/构建：写在 .env.local（已被 .gitignore 忽略，不会提交）
 *  - 线上部署：在仓库 Settings → Secrets and variables → Actions
 *    添加同名 Secret，deploy.yml 构建时注入
 *
 * Fine-grained Token 权限：仅授权本仓库，Contents: Read and write
 * ============================================================ */

export const GITHUB_CONFIG = {
  token: process.env.NEXT_PUBLIC_GH_TOKEN ?? "",
  owner: "EthanWangHaven",
  repo: "EthanWangHaven.github.io",
  branch: "main",
}

export function githubApiUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`
}
