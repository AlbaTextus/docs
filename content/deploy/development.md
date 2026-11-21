# 开发与目录约定

## 目录与命令

```text
cmd/                  服务入口、开发 seed、创作者库建库与 Status 接入工具
internal/             配置、统一 HTTP 装配、账户存储及过渡适配
modules/oauth/        账户、session、OAuth、外部 Key、Passkey 与第三方登录
modules/image/        图床上传、文件管理与本地/S3 存储
modules/creatplat/    投稿、审核、历史与修订
modules/athub/        正式内容、准入适配及内容库的 Prisma 工具配置
prisma/               四套数据库的 Prisma schema：oauth/、athub/、creatplat/、image/
web/app/              Next.js 页面与全局样式
web/components/       按业务域分组的组件，见「前端目录与命名规范」
web/lib/              前端 API 与按业务域分组的逻辑
web/styles/           全局与各业务域样式
temp/                 本地临时脚本、检查与日志
release/              本地构建与发布产物
```

| 命令 | 用途 |
| --- | --- |
| `npm run server:dev` | 一个进程运行 OAuth、图床、邮件、创作者平台和 ATHub，只监听聚合端口 `8010` |
| `npm run test:go` | 运行正式 Go 代码及所有业务模块测试，排除 temp 中的过程脚本 |
| `npm run db:athub:deploy` | 建立内容库表结构 |
| `npm run db:creatplat:deploy` | 建立创作者库表结构 |
| `npm run db:image:deploy` | 建立图床库表结构 |
| `pnpm web:dev` | 前端开发服务 |
| `pnpm web:typecheck` | TypeScript 类型检查 |
| `pnpm db:validate` | 校验账户库的 Prisma schema |
| `pnpm db:format` | 格式化账户库的 Prisma schema |
| `pnpm db:migrate` | 修改账户库 schema 后，在开发库生成并应用结构变更 |
| `pnpm db:deploy` | 建立账户库表结构 |
| `pnpm db:studio` | 打开账户库的管理界面 |

Prisma schema 是数据库结构的来源；Go 服务没有 Prisma Client，也不会在启动时自动建表，四套数据库的说明见[数据库](/deploy/database)。首次检查前端或更换构建目录时，先完成一次前端构建，生成 Next.js 路由类型。

相邻的 Status 后台可通过 `go run ./cmd/register-status` 接入当前 OAuth。工具创建独立机密应用 `albatextus-status`，最低角色为 `ADMIN`，仅申请 `profile`；默认回调为 `http://127.0.0.1:3100/api/auth/callback`，凭据写入 `../status/.dev.vars`。应用所有者使用 `SEED_ADMIN_EMAIL` 对应的现有管理员，也可在首次登记时用 `-admin-id <UUID>` 指定。Status 默认按服务端用户资料中的 `role` 允许 `ADMIN`、`SUPER_ADMIN`，符合条件的其他账号也能登录；OAuth 应用更严格的 `SUPER_ADMIN` 最低角色会保留。支持 `-app-url`、`-issuer-url`、`-output`；重复运行保留已有密钥、回调、Status 管理密钥和自定义允许名单。登记后在 Status 执行 `npm run db:migrate:local` 并重启开发服务。工具不会重置用户、运行 seed 或修改其他应用。

目前未提供 OIDC ID Token 或跨子系统统一登出。功能问题和接入反馈可提交到 [GitHub Issues](https://github.com/AlbaTextus/atnexus/issues)。

## 前端目录与命名规范

`web/` 下的 `components/`、`lib/`、`styles/` 均按业务域分组，三者使用同一套域名：

```text
components/ui/            shadcn 基础组件，由 components.json 管理
components/presentation/  不依赖路由与业务反馈的纯展示实现
components/shared/        跨业务域复用的组件
components/layout/        站点页头、页脚、主题与全局 Provider
components/{auth,account,admin,home,maintenance,novel,creatplat}/
lib/                      根目录只放跨域基础：api、feedback、content-cache、utils
lib/{auth,account,admin,athub,novel,creatplat,maintenance,home}/
styles/index.css          全局样式入口，由 app/globals.css 引入
styles/base/              主题 token、字体、滚动条及通用组件样式
styles/{site,auth,novel,creatplat}/
hooks/                    跨域复用的 React hooks
```

- 文件与目录一律使用 kebab-case；组件文件名与其主导出的组件名对应（`novel-detail-view.tsx` 导出 `NovelDetailView`）。
- 新文件放入所属业务域目录，不在 `components/`、`styles/` 根目录平铺；只有被两个以上业务域使用的组件才放入 `shared/`。
- 业务域专用的基础控件放在该域的 `ui/` 子目录（如 `components/novel/ui/`），不与 `components/ui/` 混用。
- 跨目录引用统一使用 `@/` 绝对路径；样式文件之间使用相对路径 `@import`。
- 正式代码的文件名与标识符不使用 demo、temp 等过程性命名。

## UI 与字体维护

Web 的组件、主题、字体与页面展示样式在 atnexus 项目内独立维护，不依赖 `@albatextus/ui` 包或相邻的 ATUI 仓库。基础组件实现位于 `web/components/ui/`，其他展示组件位于 `web/components/`，带业务反馈或路由适配的组件继续包装 `web/components/presentation/` 中的本地实现。

应用与用户管理使用共享 `StatCard`；列表使用 `EmptyState`；删除通行密钥、解绑账号、删除应用及重置密钥使用 `ConfirmDialog`。这些组合归在 card / empty / dialog 组件组中，不在页面内重复维护骨架。请求、统计和名称二次确认仍在账户模块，密钥按需读取与隐藏清除的逻辑保持不变。

PasswordInput 与 CopyField 的静态密钥显隐共用本地 InputGroupPassword；ClientSecretField 继续独立负责按需读取及隐藏时清除服务端密钥，不将其改为预加载静态字段。底层 Base UI、动画和 Markdown 等依赖直接在 `web/package.json` 中声明。

首页授权示例使用 `web/components/shared/code-highlighted/` 中的 `CodeHighlighted`，保留深色终端外观，只为该示例加载 HTTP 语法，不在全局初始化高亮引擎。个人简介及编辑预览中的 Markdown 代码块继续按需高亮，沿用全站明暗主题、中文复制反馈和纯文本回退。

`web/app/globals.css` 引入本地 `web/styles/index.css`，主题 token、页面样式与字体声明均保留在 `web/styles/`。字体文件和 OFL 许可证位于 `web/fonts/`，构建时自动生成静态资源地址，不依赖外部字体服务。修改后运行 `pnpm web:typecheck` 和 `pnpm web:build`；依赖更新时同步锁文件，部署使用 `pnpm install --frozen-lockfile`。Docker 构建只需 atnexus 自身目录。
