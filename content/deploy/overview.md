# 服务总览

atnexus 是 ALBATEXTUS 的统一服务。一个 Go 程序运行四个模块，后端只监听聚合端口 `8010`（`GATEWAY_HTTP_ADDR`），按路径前缀分发请求：

| 模块 | 公开路径前缀 | 职责 |
| --- | --- | --- |
| `modules/oauth/` | `/api/v1`、`/oauth`、`/.well-known` | 账户、session、OAuth 与外部 API Key 管理/校验 |
| `modules/image/` | `/api/v2`、`/file` | 图床上传、文件管理、本地/S3 存储 |
| `modules/creatplat/` | `/api/v4` | 投稿、审核、历史、修订 |
| `modules/athub/` | `/api/v5` | 书库与正式内容 |

反向代理只需一个 API 上游，见[聚合端口](/deploy/production)。

image 已将原 imgbed 后端改写为 Go，元数据迁入独立 PostgreSQL，原图床前端保持原样；library 已取消；other 未指定业务，暂不启动。
OAuth、ATHub、创作者平台和图床分别使用自己的数据库，可位于同一 PostgreSQL 实例。图床保留原 `/file/` 文件地址。迁移与恢复说明见 [image 模块](/image/overview)，完整实施边界见 [重构计划](https://github.com/AlbaTextus/atnexus/blob/main/atnpan-ban.md)。

Go module 路径为 `github.com/AlbaTextus/atnexus`，根工作区包为 `@albatextus/atnexus`，
账户前端包为 `@albatextus/atnexus-web`，统一程序名为 `atnexus`。

后端使用 Go，前端使用 Next.js、React 和 shadcn/ui，数据存储于 PostgreSQL。Prisma 负责数据库结构与迁移，Go 运行时通过 pgx 访问数据库。

前端位于 `web/`，默认监听 `3288`，是账户中心、小说库和创作者平台页面的入口。

## 功能一览

| 模块 | 当前能力 |
| --- | --- |
| 账户认证 | 邮箱验证码注册、邮箱或登录标识与密码登录、会话管理、记住邮箱 |
| 邮箱管理 | SMTP 验证码、验证已有邮箱、绑定或更换邮箱 |
| 第三方登录 | GitHub、LINUX DO Connect、自定义 OAuth 平台，支持绑定与解绑 |
| 通行密钥 | WebAuthn / Passkey 注册、无用户名登录、凭据管理 |
| 人机验证 | Cloudflare Turnstile，服务端验证令牌 |
| 个人中心 | 个人资料、昵称、平台头像来源、密码及登录方式管理 |
| OAuth 服务 | 授权码、S256 PKCE、刷新令牌轮换、客户端凭证、令牌撤销与自省 |
| 授权确认 | 展示应用与申请权限，用户明确允许后才签发授权码 |
| 管理后台 | 应用接入、客户端密钥、最低访问角色、用户管理、协议编辑 |
| ATHub 内容（v5） | 平台、作者、小说、卷、章节、全书目录与批量上传 |
| 创作者平台（v4） | 投稿、审核、修订、贡献者、按请求合并的变更记录、字段前后对比 |

## 部署顺序

1. **准备环境**：Go 1.26.1+、Node.js 24+、pnpm 和 PostgreSQL。见[本地快速开始](/deploy/local)。
2. **配置**：在仓库根目录的 `.env` 中填写数据库连接、对外地址和加密密钥。见[环境变量](/deploy/environment)。
3. **建库并迁移**：账户、内容、创作者、图床四套数据库分别迁移；程序启动时不会自动建表。见[数据库与迁移](/deploy/database)。
4. **构建**：本地直接构建，或生成 Linux AMD64 发布包。见[构建与发布](/deploy/build)；容器方式见 [Docker Compose](/deploy/docker)。
5. **启动并检查**：启动后端与前端，确认四个模块的健康检查均返回 200，地址见[健康检查](/deploy/production)。
6. **接入正式入口**：HTTPS、反向代理、Cookie 与备份要求见[生产部署与升级](/deploy/production)。

各模块自身的说明见 [ATHub](/athub/module)、[OAuth](/oauth/overview)、[图床](/image/overview)和[创作者平台](/creatplat/overview)。
