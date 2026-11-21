# 本地快速开始

以下命令在仓库根目录执行。需要 Go 1.26.1+、Node.js 24+、pnpm 和 PostgreSQL。仓库通过 `packageManager` 固定 pnpm 版本；Docker Compose 使用 PostgreSQL 16。

## 1. 准备环境

```bash
cp .env.example .env
pnpm install --frozen-lockfile
npm run db:athub:install
```

PowerShell 可用 `Copy-Item .env.example .env` 复制配置。已有 `.env` 时直接编辑，不要覆盖现有凭据。

生成一次客户端密钥加密用的随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将输出填入根目录 `.env` 的 `CLIENT_SECRET_ENCRYPTION_KEY`。它必须是 32 字节密钥的 64 位十六进制编码，后续启动应复用同一个值。

本地关键配置如下，其余配置见 [.env.example](https://github.com/AlbaTextus/atnexus/blob/main/.env.example)：

```dotenv
DATABASE_URL=postgresql://oauth:oauth@localhost:5432/oauth?sslmode=disable
ATHUB_DATABASE_URL=postgresql://athub:athub@localhost:5433/athub?sslmode=disable
# 唯一的后端监听地址，按路径前缀分发给五个模块。
GATEWAY_HTTP_ADDR=:8010
# 独立图床库；使用实际连接和已有文件目录。
IMAGE_DATABASE_URL=
IMAGE_LOCAL_ROOT=
IMAGE_TEMP_ROOT=temp/image
IMAGE_PUBLIC_URL=http://localhost:8010
ISSUER_URL=http://localhost:3288
AUTH_UI_URL=http://localhost:3288
COOKIE_SECURE=false
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_ORIGINS=http://localhost:3288
```

## 2. 初始化数据库

分别配置账户库 `DATABASE_URL`、内容库 `ATHUB_DATABASE_URL`、创作者库 `CREATPLAT_DATABASE_URL` 和图床库 `IMAGE_DATABASE_URL`。四套数据库的说明见[数据库](/deploy/database)。

没有现成的 PostgreSQL 时，可以配置创作者数据库凭据后使用仓库提供的三个数据库容器；图床库没有容器，需要在已有的 PostgreSQL 实例中另建一个数据库：

```bash
docker compose up -d postgres athub-postgres creatplat-postgres
```

数据库就绪后建表并写入开发数据：

```bash
pnpm db:deploy
npm run db:athub:deploy
npm run db:creatplat:deploy
npm run db:image:deploy
pnpm db:seed
```

统一服务启动时检查四套数据库，任何一套初始化失败都不会开始监听。

`db:seed` 是开发初始化命令，会创建或更新以下账户和示例客户端：

| 项目 | 默认值 |
| --- | --- |
| 管理员邮箱 | `admin@example.com` |
| 管理员密码 | `Admin123!ChangeMe` |
| 管理员角色 | `ADMIN` |
| 示例 Client ID | `albatextus-web` |
| 示例 Client Secret | `development-secret-change-me` |
| 示例回调 | `http://localhost:3288/auth/callback` |

可用 `SEED_ADMIN_EMAIL`、`SEED_ADMIN_PASSWORD`、`SEED_ADMIN_NAME`、`SEED_CLIENT_ID`、`SEED_CLIENT_SECRET`、`SEED_CLIENT_REDIRECT_URIS`、`SEED_CLIENT_NAME`、`SEED_CLIENT_GRANT_TYPES`、`SEED_CLIENT_SCOPES`、`SEED_ACCESS_TOKEN_TTL`、`SEED_REFRESH_TOKEN_TTL` 覆盖默认值。Seed 会输出开发凭据，也会更新已有记录；不要把它作为每次部署必跑的步骤。

示例回调只是登记值，本项目没有实现 `/auth/callback` 应用页面，实际接入时需替换。

## 3. 启动服务

终端一启动 Go API：

```bash
go run ./cmd/server
```

终端二启动前端：

```bash
pnpm web:dev
```

访问 [首页](http://localhost:3288/)、[登录页](http://localhost:3288/login) 或 [用户中心](http://localhost:3288/account)。后端只监听 `8010`，例如 `http://localhost:8010/api/v1/healthz` 用于检查账户模块，`http://localhost:8010/api/v5/content?novelId=1&order=1` 用于访问内容接口。

Next.js 将 `/api/v1/*`、邮件接口 `/api/v3/*`、`/oauth/*` 和 `/.well-known/*` 转发至 `OAUTH_BACKEND_URL`，将创作者操作 `/api/v4/*` 转发至 `CREATPLAT_BACKEND_URL`。两个地址都默认指向 `http://localhost:8010`。浏览器中不要混用 `localhost` 和 `127.0.0.1`，否则 Cookie 和 Passkey 的来源校验可能不一致。

小说内容 `/api/v5/*` 和历史查询 `/api/v4/*` 分别使用 `NEXT_PUBLIC_ATHUB_API_URL` 和 `NEXT_PUBLIC_CREATPLAT_API_URL` 从浏览器直连聚合入口，本地都填写 `http://localhost:8010`。两个变量都需在前端构建前配置。生产入口须与账户页面共享 Cookie 主机范围。

`pnpm web:dev` 默认使用 Turbopack。中文字体的 `regular.css` 和 `medium.css` 在 `web/app/layout.tsx` 中作为独立 CSS 入口加载，不要再通过 `web/styles/base/fonts.css` 的 `@import` 合并。Windows 本地环境中，两套分片字体及其 source map 合并为大型 PostCSS IPC 结果时会卡住首次编译；分离入口保留相同的字体、字重和样式，并缩小单次转换结果。

## 4. 本地联调

第三方登录的本地回调地址为 `http://localhost:3288` 加上各平台的回调路径，例如 GitHub 为 `http://localhost:3288/api/v1/auth/providers/github/callback`。平台凭据与回调路径见[登录与账户](/oauth/login)。

Turnstile 可使用 [Cloudflare 官方测试密钥](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)：

```dotenv
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
TURNSTILE_TEST_MODE=true
```

测试模式不提供真实机器人防护，`APP_ENV=production` 会拒绝测试模式和官方测试密钥。
