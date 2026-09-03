# 博客 Android App 迁移计划

> 目标：将现有 Next.js 静态博客 (`EthanWangHaven.github.io`) 原汁原味迁移为 Android 原生应用，保留全部页面、功能和视觉风格。

---

## 一、现有项目架构概览

| 维度 | 现状 |
|------|------|
| 框架 | Next.js 16.3.4 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS v4 + CSS 变量主题系统 (深浅色) + 毛玻璃拟态 |
| 动画 | motion/react (Framer Motion) |
| 图标 | lucide-react |
| 内容 | 本地 `.mdx` 文件 (41 篇博客 + 3 篇 Moments)，构建时静态导出 |
| 部署 | `output: "export"` → GitHub Pages 静态站 |
| 后端 | 无服务端，仅有静态 JSON 搜索索引 + GitHub REST API (Moment 上传) |
| 外部 API | wttr.in 天气 API、GitHub Contents API |
| 语言工具 | 独立 HTML 文件 (英/德/日)，非 Next.js 构建 |

### 页面路由

| 路由 | 功能 |
|------|------|
| `/` | 首页：Hero + 打字机 + 时钟/统计/日历/天气卡片 + 快捷入口 + 最近文章 |
| `/blog` | 博客列表 (分页 20/页) |
| `/blog/[slug]` | 文章详情：MDX 渲染 + TOC + 阅读进度 + 返回顶部 |
| `/categories` | 分类列表 |
| `/categories/[name]` | 分类文章 |
| `/tags` | 标签列表 |
| `/tags/[name]` | 标签文章 |
| `/moments` | 生活瞬间 + GitHub 上传弹窗 |
| `/languages` | 语言工具入口 (6 个独立 HTML) |
| `/api/search` | 静态 JSON 搜索索引 |

### 核心组件

| 组件 | 功能 |
|------|------|
| Sidebar | 桌面竖向毛玻璃侧栏 + 移动端底部导航 |
| SearchOverlay | Ctrl+K 全局搜索覆盖层 |
| MusicPlayer | 三态悬浮音乐播放器 (可拖拽 + 歌词同步 + 歌单) |
| HomeWidgets | 时钟 / 站点统计 / 日历 / 天气四卡片 |
| Fireflies | Canvas 流萤粒子背景 (深浅色自适应) |
| SplashScreen | 开屏加载动画 |
| Typewriter | 首页打字机文字动画 |
| TableOfContents | 文章 TOC 滚动高亮 |
| ReadingProgress | 顶部阅读进度条 |
| BackToTop | 返回顶部按钮 |
| MomentUpload | Moment 上传弹窗 (GitHub API) |
| ThemeProvider | 深浅色主题切换 |

---

## 二、技术方案选型

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **A. WebView 包装** | 开发量最小，保留全部 UI/功能，无需重写组件 | 性能有损耗，离线需额外处理，部分原生交互体验差 | ★★★☆☆ |
| **B. React Native** | 可复用 React 知识，接近原生性能，可上架 Play Store | 需重写所有组件为 RN 等效物，CSS 变量/Tailwind 不可直接用，动画库需替换 | ★★★☆☆ |
| **C. Capacitor (Ionic)** | Web 技术栈直接封装为原生 App，保留全部 React 代码，可调用原生 API | 本质仍是 WebView，但比纯 WebView 更接近原生 | ★★★★☆ |
| **D. Kotlin Compose 原生** | 最佳性能和体验，完全原生 | 需从零重写全部页面和组件，工作量巨大 | ★★☆☆☆ |

### 推荐：方案 C — Capacitor

**理由：**
1. 现有项目是纯静态导出 (`output: "export"`)，Capacitor 天然支持
2. 全部 React 组件、CSS 变量、Tailwind、motion 动画**无需修改**
3. 可调用原生 API（相机、文件上传、振动等）
4. 可打包为 APK 上架 Google Play / 国内应用商店
5. 支持离线缓存（Service Worker）
6. 迁移成本最低，保留度最高

---

## 三、Capacitor 迁移步骤

### 阶段 1：项目初始化 (1-2 天)

```
1. 安装 Capacitor
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/android

2. 初始化
   npx cap init "WangCe Notes" "cn.wangce.blog" --web-dir=out

3. 修改构建配置
   - next.config.ts 保持 output: "export"
   - 确保 basePath 为空（Capacitor 用 file:// 协议加载）
   - 添加 <base href="./"> 到 HTML head

4. 构建并同步
   npm run build          # 生成 ./out 静态文件
   npx cap add android    # 添加 Android 平台
   npx cap copy           # 同步静态文件到 Android 工程
```

### 阶段 2：静态资源路径修复 (1 天)

**关键问题：** Capacitor 用 `file://` 协议，绝对路径 `/images/xxx` 无法解析。

```
修复范围：
├── 所有 <img src="/images/..."> → <img src="./images/...">
├── 音频路径 /audio/*.mp3 → ./audio/*.mp3
├── 语言工具 HTML 内的路径
├── API 搜索索引路径 /api/search → ./api/search
├── Moment 上传图片路径 /img/moments/ → ./img/moments/
└── Next.js <Link> 组件（App Router 已用相对路径，需验证）
```

**方案：** 在 `next.config.ts` 中设置 `basePath: ""`，或用 Capacitor 的 `server.androidScheme: "https"` 配合 `Capacitor Preferences` 处理路径。

### 阶段 3：原生功能适配 (2-3 天)

| Web 功能 | Android 原生替代 | 实现方式 |
|----------|-----------------|----------|
| localStorage | Capacitor Preferences | 自动兼容，无需修改 |
| 主题切换 | 同上 | CSS class 切换，自动生效 |
| 天气 API (wttr.in) | HTTP 请求 | Capacitor HTTP 插件或 WebView fetch |
| GitHub API 上传 Moment | 原生文件选择 | `@capacitor/camera` 或 `@capacitor/filesystem` 选图 + fetch 上传 |
| 音乐播放 | WebView Audio | 自动支持，需处理后台播放锁 |
| 搜索 | 静态 JSON fetch | 路径修复后自动生效 |
| 语言工具 HTML | WebView 内嵌 | iframe 或 Capacitor WebView 打开 |
| 震动反馈 (可选) | `@capacitor/haptics` | 增强交互体验 |
| 状态栏适配 | `@capacitor/status-bar` | 状态栏颜色跟随主题 |
| 安全区域 | `@capacitor/safe-area` | 适配刘海屏 |
| 应用内更新 | `@capacitor/live-update` | 热更新静态资源 |

### 阶段 4：UI 细节适配 (2-3 天)

| 适配项 | 说明 |
|--------|------|
| 侧边栏 | 移动端底部导航已适配，需调整 safe-area padding |
| 开屏动画 | SplashScreen 组件 → 可选替换为 Capacitor 原生 Splash |
| 流萤粒子 | Canvas 在 WebView 中性能可接受，需测试低端设备 |
| 毛玻璃效果 | backdrop-filter 在 Android WebView 中支持良好 |
| 打字机动画 | 纯 CSS/JS，无兼容问题 |
| 音乐播放器拖拽 | Pointer Events 在 WebView 中支持良好 |
| TOC 滚动高亮 | IntersectionObserver 在 WebView 中支持良好 |
| 深色模式 | 跟随系统或手动切换，CSS 变量自动生效 |

### 阶段 5：离线与缓存 (1-2 天)

```
1. Service Worker
   - 缓存静态 HTML/JS/CSS
   - 缓存图片和音频文件
   - 离线模式下显示缓存内容

2. Workbox (推荐)
   - npx @capacitor/pwa-kit  (或手动配置)
   - 预缓存 App Shell
   - 运行时缓存图片/音频

3. 内容更新策略
   - 检查 GitHub Pages 最新版本
   - 提示用户更新
```

### 阶段 6：打包发布 (1-2 天)

```
1. 生成签名
   keytool -genkey -v -keystore wangce-release.keystore -alias wangce -keyalg RSA -keysize 2048 -validity 10000

2. 构建 APK
   npx cap build android --keystore wangce-release.keystore --keystore-pass <密码> --keystore-alias wangce

3. 或用 Android Studio
   - 打开 android/ 目录
   - Build → Generate Signed Bundle / APK
   - 输出 release APK / AAB

4. 上架
   - Google Play Console (需开发者账号 $25)
   - 国内应用商店 (华为/小米/OPPO/VIVO 等)
```

---

## 四、功能迁移对照表

| 功能 | 迁移方式 | 难度 | 备注 |
|------|----------|------|------|
| 首页 (Hero + 卡片 + 文章) | 直接复用 | ★☆☆ | 路径修复后自动生效 |
| 博客列表 + 分页 | 直接复用 | ★☆☆ | |
| 文章详情 + MDX + KaTeX | 直接复用 | ★★☆ | KaTeX CSS 需打包到本地 |
| TOC + 阅读进度 + 返回顶部 | 直接复用 | ★☆☆ | |
| 分类 / 标签页 | 直接复用 | ★☆☆ | |
| Moments 列表 | 直接复用 | ★☆☆ | |
| Moment 上传 | 需适配原生文件选择 | ★★★ | 替换 `<input type=file>` 为 Capacitor Camera/Filesystem |
| 搜索 | 直接复用 (静态 JSON) | ★☆☆ | 路径修复 |
| 语言工具 HTML | WebView iframe | ★★☆ | 独立 HTML 需打包到 assets |
| 音乐播放器 | 直接复用 + 后台播放配置 | ★★☆ | 需 Android foreground service 配置 |
| 深浅色主题 | 直接复用 | ★☆☆ | |
| 流萤粒子 | 直接复用 | ★☆☆ | 低端设备可能需降级 |
| 开屏动画 | 直接复用或原生替换 | ★☆☆ | |
| 打字机动画 | 直接复用 | ★☆☆ | |
| 天气卡片 | 直接复用 | ★★☆ | 需网络权限 |
| 时钟 / 日历 / 站点统计 | 直接复用 | ★☆☆ | |

---

## 五、依赖与工具

### Capacitor 插件

| 插件 | 用途 |
|------|------|
| `@capacitor/android` | Android 平台支持 |
| `@capacitor/status-bar` | 状态栏样式控制 |
| `@capacitor/haptics` | 震动反馈 |
| `@capacitor/preferences` | 替代 localStorage (兼容) |
| `@capacitor/filesystem` | 文件操作 (Moment 图片选择) |
| `@capacitor/camera` | 相机/相册 (可选) |
| `@capacitor/app` | 生命周期管理 |
| `@capacitor/splash-screen` | 原生开屏 (可选) |

### 构建工具

- Android Studio (Giraffe+)
- JDK 17+
- Android SDK (API 24+, Android 7.0+)

---

## 六、风险与注意事项

| 风险 | 影响 | 应对 |
|------|------|------|
| `file://` 协议下绝对路径失效 | 图片/音频/链接 404 | 全局改为相对路径 `./` |
| KaTeX 字体加载 | 数学公式不显示 | 字体文件打包到本地 |
| wttr.in 国内访问不稳定 | 天气卡片加载失败 | 添加超时处理 + 缓存上次结果 |
| GitHub Token 前端暴露 | 安全风险 | 改用 Capacitor HTTP + 环境变量注入 |
| WebView 版本碎片化 | 部分老设备 CSS 不支持 | 设置最低 API 24 (Android 7.0) |
| 音频文件 37MB | APK 体积大 | 考虑首启动后下载或流式加载 |
| 流萤粒子低端机卡顿 | 性能问题 | 检测设备性能降级为静态背景 |

---

## 七、时间估算

| 阶段 | 预估 |
|------|------|
| 阶段 1：项目初始化 | 1-2 天 |
| 阶段 2：路径修复 | 1 天 |
| 阶段 3：原生功能适配 | 2-3 天 |
| 阶段 4：UI 细节适配 | 2-3 天 |
| 阶段 5：离线缓存 | 1-2 天 |
| 阶段 6：打包发布 | 1-2 天 |
| **合计** | **8-13 天** |

---

## 八、未来可选增强

| 功能 | 方式 |
|------|------|
| 推送通知 | `@capacitor/push-notifications` — 新文章推送 |
| 离线阅读 | 预下载文章 + 图片到本地 |
| 分享功能 | `@capacitor/share` — 分享文章到微信/微博 |
| 书签/收藏 | 本地 SQLite 存储收藏文章 |
| 阅读进度同步 | Capacitor Preferences + 远程同步 |
| AI 助手 | 接入大模型 API (类似 aibrium.cn 的猫猫助手) |
