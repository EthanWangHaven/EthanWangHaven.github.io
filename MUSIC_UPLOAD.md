# 音乐上传功能说明

## 功能概述

在音乐播放器的歌单面板中，可以通过右上角 **➕** 按钮添加新歌。支持两种方式：

| 模式 | 说明 |
|------|------|
| 音乐 id 解析 | 粘贴网易云歌曲 id 或完整链接 → 自动解析歌名/歌手并下载音源 → 一键入库 |
| 上传音源文件 | 手动填写歌名/歌手，上传本地音频文件（mp3 / m4a / flac 等，≤60MB） |

提交后自动 push 到 GitHub 仓库，由 Actions 重新构建部署，**约 1-2 分钟后新歌可播放**。

## 使用入口

```
点击悬浮音乐图标 → 点迷你卡片右上角展开按钮（双向箭头）
→ 切换到「歌单」tab → 右上角 ➕ → 弹窗中操作
```

- **id 解析模式**：输入框支持纯数字 id（如 `2707652860`）或完整歌曲链接（如 `https://music.163.com/#/song?id=2707652860`、App 分享链接）。粘贴链接后自动提取 id；歌手页/专辑页/歌单页链接会给出明确提示，需打开具体歌曲页面复制链接。
- 解析成功后歌名/歌手自动填充（可修改），音源就绪后点「添加到歌单」提交。
- **上传文件模式**：选择本地音频，手动填写音乐名称和歌手名称后提交。

## 技术实现

### 数据流

```
输入 id/链接
  → Meting 公共实例解析歌曲信息（音源直链）
  → 下载音源（直连失败自动切换 corsproxy / allorigins 跨域代理）
  → GitHub Contents API 提交 1：音源写入 public/audio/{id}.{ext}
  → GitHub Contents API 提交 2：歌单追加写入 data/playlist.json + public/data/playlist.json（线上副本，供 APP 同步）
  → push 触发 deploy.yml 自动构建部署
```

### 涉及文件

| 文件 | 职责 |
|------|------|
| `components/music-add-dialog.tsx` | 添加音乐弹窗 UI（两种模式、解析/提交状态、错误提示） |
| `components/music-player.tsx` | 歌单 tab 右上角 ➕ 按钮；添加成功后本地歌单即时追加 |
| `lib/music-repo.ts` | 核心：id 提取/解析、音源下载、GitHub Contents API 提交 |
| `lib/github-config.ts` | GitHub Token / 仓库配置（Moment 上传共用） |
| `data/playlist.json` | 歌单数据源（线上通过 GitHub API 更新） |
| `public/data/playlist.json` | 歌单线上副本（随站点部署，APP 同步拉取端点，上传时自动同步） |
| `.github/workflows/deploy.yml` | 构建时注入 `NEXT_PUBLIC_GH_TOKEN` 环境变量 |

### id 安全处理

提交入库前对 id 和扩展名做字符过滤（仅保留 `a-zA-Z0-9_-`），防止粘贴的链接（含 `#`、`/` 等字符）破坏 GitHub API 请求路径。

## Token 配置

Token 通过环境变量 **`NEXT_PUBLIC_GH_TOKEN`** 注入（构建时内联进前端产物）：

- **本地开发/构建**：写在项目根目录 `.env.local`（已被 `.gitignore` 忽略，不会提交）：
  ```
  NEXT_PUBLIC_GH_TOKEN=ghp_xxxxxxxx
  ```
- **线上部署**：仓库 **Settings → Secrets and variables → Actions → Repository secrets**，添加同名 secret `NEXT_PUBLIC_GH_TOKEN`。deploy.yml 构建步骤会读取并注入。

> 注意：源码中不要出现明文 token，否则 GitHub secret 扫描会拒绝推送（push protection）。

### Token 权限要求

- **推荐 Fine-grained token**：https://github.com/settings/personal-access-tokens/new
  - Repository access：仅选择 `EthanWangHaven.github.io`
  - Permissions：`Contents: Read and write`
- Classic token 亦可，但必须勾选 `repo` scope。

### 安全须知

该站点为纯静态部署（GitHub Pages），Token 会被内联进公开的 JS 产物中，**任何访问者都能从源码提取**。因此：

- 必须使用**最小权限** token（仅本仓库 + Contents 读写），泄露时影响限于本仓库内容可被篡改
- 不要使用全账号权限的 classic token
- 泄露/更换时：吊销旧 token → 更新 `.env.local` 和 Actions Secret → 重新部署

## 常见问题

| 现象 | 原因与处理 |
|------|-----------|
| 提示「未配置 GitHub Token」 | `.env.local`（本地）或 Actions Secret（线上）未配置 `NEXT_PUBLIC_GH_TOKEN`；线上修改 Secret 后需重新触发部署 |
| 「这是歌手主页链接…」 | 粘贴的是歌手/专辑/歌单页链接，请打开具体歌曲页面复制链接 |
| 解析失败 / 音源下载失败 | 网易云对音源直链管控严格，受版权保护的歌曲可能拿不到直链；可手动下载后用「上传音源文件」添加。解析实例失效时可更换 `lib/music-repo.ts` 顶部的 `METING_API` |
| 「path cannot end with a slash」 | 旧版将原始输入当文件名所致，已通过 id 安全过滤修复 |
| 添加成功但播不了 | 正常现象，等待 Actions 部署完成（约 1-2 分钟）后刷新 |
| 歌单中已存在相同 id | 该歌曲已在歌单中，无需重复添加 |
