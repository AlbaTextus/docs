# ALBATEXTUS 文档站

独立 Next.js 16 App Router 文档站。主页不绑定单一项目；目前已有的 ATHub 内容读取本项目的 `content/athub/API.md`，覆盖全部 17 个 API 操作（含全书目录 `/toc`），不修改 ATHub 业务代码。其他项目的内容及切换逻辑尚未接入。

ATHub 对外服务地址统一为 `https://api.albatextus.com`。快速开始与三种语言的请求示例共用 `lib/api.ts`；完整调用示例从 `content/athub/API.md` 读取。

## API 文档维护

- 后续 ATHub API 文档更新直接修改 `content/athub/API.md` 的对应章节，此文件是正文与 JSON 示例的唯一来源；不再回写或复制到 `athub/docs/API.md`。
- 新增或调整接口时，同步维护 `lib/navigation.ts` 中的路径、方法、分组、章节和响应结构映射；导航、搜索和 Markdown 下载自动使用同一配置。
- 通用服务地址与鉴权说明集中放在快速开始和鉴权页，各接口请求代码仍保留必需的 Bearer 请求头。
- 更新后运行 `npm test` 和 `npm run build`，核对正文、请求代码、响应结构与下载内容。

## 本地启动

```powershell
cd D:\AlbaTextus\docs
npm install
npm run dev
```

访问 http://127.0.0.1:3310；API 页面示例：http://127.0.0.1:3310/athub/upload。

## 技术与复用

- Next.js 16、React 19、TypeScript strict、Tailwind CSS v4。
- 直接使用 `@cloudflare/kumo/components/sidebar` 的组合式侧栏：折叠分组、图标模式、悬停预览、移动端抽屉。
- 首页导航栏直接复制 ATUI 的 `SiteHeader` 源码，保留图标导航、提示、品牌字标与滚动收起动画；文档内页不显示顶部导航栏，主题与返回首页入口位于侧栏底部。
- 页脚、主题、按钮、对话框、代码高亮均复制到 `components/ui/`，滚动逻辑在 `components/hooks/`，样式和字体分别在 `styles/`、`fonts/`；均由 Docs 自行维护，不依赖 `@albatextus/ui` 或跨项目源码。
- 首页移除 ATHub 专属宣传内容，展示本地复制的 ATUI 架构图，节点图标改为文档主题，方格与图标使用蓝粉配色；站点页脚仅在首页显示。
- 文档侧栏顶部提供项目下拉菜单的外观与展开交互，当前显示 ATHub；ATUI、OAuth 仅为未接入的禁用选项，不切换路由，不改变文档内容。
- 页脚独立使用线框品牌字标：向下滚动逐步描绘 ALBATEXTUS，蓝粉色中融入细密星尘颗粒，不添加装饰性小字、星形图标或星座连线。手机端分行显示，减少动态效果模式直接显示完整轮廓，离屏时暂停材质微光。
- 文档正文、请求参数、JSON 请求和响应示例均来自本项目的 `content/athub/API.md`。
- 搜索支持标题、描述、HTTP 方法和接口路径，快捷键 Ctrl/Cmd+K。
- 提供 cURL / JavaScript / Python 示例与 Markdown 复制、下载；不在浏览器发送带服务密钥的请求。

## 检查和构建

```powershell
npm run typecheck
npm test
npm run build
npm start
```

开发缓存和类型检查产物在 `temp/`，生产构建在 `release/next/`。过程测试、截图在工作区根目录 `../temp/docs/`。

工作区浏览器回归检查（使用 Docs 本地的 Playwright）：

```powershell
node ..\temp\docs\browser-check.cjs
```

默认检查运行中的 `http://127.0.0.1:3310`；可用 `DOCS_TEST_URL` 指定其他预览地址。首次运行先执行 `npx playwright install chromium`。覆盖导航提示与滚动收起、全部文档路由、Markdown 下载、搜索、剪贴板、代码标签页、明暗主题、侧栏折叠与悬停预览、手机导航和横向溢出检查。

生产构建和运行时须保留本项目的 `content/athub/API.md`，不再依赖同级 `athub` 仓库或本地 `atui` 包。修改本地 Markdown 后重新构建即可更新发布内容；开发环境刷新页面即可读取最新正文。

## Cloudflare 部署

生产域名为 `https://docs.albatextus.com`，Worker 名称为 `albatextus-docs`。
Cloudflare 使用 vinext、Vite 和 `cf`，部署配置位于 `cloudflare.config.ts`；
原有 Next.js 本地开发与构建命令继续保留。

```powershell
npm ci
npx cf auth login
npm run typecheck
npm test
npm run build:vinext
npx cf deploy --prebuilt --dry-run
npx cf deploy --prebuilt
```

也可运行 `npm run deploy:vinext` 完成构建与发布。`cf` 使用独立登录状态，
CI 可通过 `CLOUDFLARE_API_TOKEN` 提供部署凭据，不要将凭据写入项目配置。
使用满足 `cf` 依赖要求的 Node.js 版本（目前为 `^22.23.0 || ^24.22.0 || ^26.12.0`）。

`npm run dev:vinext` 在 3311 端口运行 Workers 开发服务；
构建后使用 `npm run start:vinext -- --host 127.0.0.1 --port 3311` 在本地预览实际 Worker。
Vite 缓存放在 `temp/vite/`，Cloudflare 构建输出按工具约定写入被忽略的 `.cloudflare/output/`。

`lib/content-source.cloudflare.ts` 在构建时嵌入同一份 `content/athub/API.md`，
Workers 无需访问本地文件系统；Markdown 下载接口保留原有查询参数与附件响应头。
更新文档后须重新构建发布。Workers 日志与追踪已启用。

### Git 自动部署

在 `albatextus-docs` 的 Settings → Builds 连接 GitHub 仓库 `AlbaTextus/docs`：

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 根目录 | `/` |
| 构建命令 | `npm run typecheck && npm run build:vinext` |
| 部署命令 | `npx cf deploy --prebuilt` |
| 非生产分支预览 | 关闭 |
| Node.js | `.node-version` 指定的版本 |

首次连接前，需在 AlbaTextus 组织安装 Cloudflare Workers & Pages GitHub App，
授权访问 `docs` 仓库，并在 Cloudflare 的连接流程中授权自己的 GitHub 账号。
连接成功后，每次推送到 `main` 都会构建并更新 `https://docs.albatextus.com`；
可在 Worker 的 Builds 页面查看构建日志和结果。
构建环境自动安装项目依赖。构建命令不运行本地 `npm test`，
因为该命令依赖仓库外的工作区临时测试脚本。
