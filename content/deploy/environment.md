# 环境变量

Go 服务从仓库根目录 `.env` 加载配置，已有进程环境变量优先。前端的 `OAUTH_BACKEND_URL`、`NEXT_PUBLIC_WIKI_URL` 和 `NEXT_OUTPUT_DIR` 需单独传给 Next.js 进程。

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接地址，必填 |
| `ATHUB_DATABASE_URL` | 内容库 PostgreSQL 连接地址，必填，与账户库分开 |
| `REDIS_ENABLED` | 是否启用 Redis 会话缓存，默认 `false`；关闭时不建立 Redis 连接 |
| `REDIS_URL` | Redis 连接地址，默认 `redis://localhost:6379/0`；支持 `redis://` 与 `rediss://` |
| `REDIS_KEY_PREFIX` | Redis 键前缀，默认 `albatextus:connect` |
| `REDIS_SESSION_TTL` | 会话缓存时长，默认 `30s`，且不会超过会话剩余有效期 |
| `CLIENT_SECRET_ENCRYPTION_KEY` | 客户端密钥与 PKCE verifier 加密密钥，必填并保持稳定 |
| `APP_ENV` | 本地为 `development`，生产为 `production` |
| `HTTP_ADDR` | OAuth 监听地址，默认 `:8001` |
| `ATHUB_HTTP_ADDR` | ATHub 监听地址，默认 `:8005` |
| `CREATPLAT_HTTP_ADDR` | 创作者平台监听地址，默认 `:8004` |
| `IMAGE_HTTP_ADDR` | 图床监听地址，默认 `:8002` |
| `IMAGE_DATABASE_URL` | 必填，独立图床 PostgreSQL 数据库 |
| `IMAGE_LOCAL_ROOT` | 必填，已有图床文件目录 |
| `IMAGE_PUBLIC_URL` | 图床公开根地址 |
| `IMAGE_LEGACY_HTTP_ADDR` | 可选，旧文件端口兼容监听 |
| `NEXT_PUBLIC_CREATPLAT_API_URL` | 浏览器直连历史查询的创作者平台公开地址 |
| `CREATPLAT_BACKEND_URL` | Next.js 转发创作者操作的后端地址 |
| `ISSUER_URL` | 对外 OAuth 地址；本地应为 `http://localhost:3288` |
| `AUTH_UI_URL` | 认证前端对外地址 |
| `COOKIE_SECURE` | HTTPS 部署设为 `true` |
| `SESSION_TTL` | 中心会话有效期，默认 `24h` |
| `LOGIN_FAILURE_LIMIT` | 同一地址对同一邮箱在窗口内允许的密码登录失败次数，默认 `10`；单个邮箱合计为 3 倍、单个地址合计为 5 倍，`0` 关闭限速 |
| `LOGIN_FAILURE_WINDOW` | 登录失败计数窗口，默认 `15m` |
| `AUTHORIZATION_CODE_TTL` | 授权码有效期，默认 `5m` |
| `WEBAUTHN_RP_ID` | Passkey 所属域名，不带协议和端口 |
| `WEBAUTHN_RP_ORIGINS` | 允许的完整前端 Origin，逗号分隔 |
| `PASSKEY_CHALLENGE_TTL` | Passkey 挑战有效期，默认 `5m` |
| `OAUTH_BACKEND_URL` | Next.js 转发到账户功能的地址，默认 `http://localhost:8001` |
| `NEXT_PUBLIC_WIKI_URL` | 独立 Wiki 服务的公开地址，用于文档、接入指南与协议链接及 `/wiki/*` 跳转，默认 `http://localhost:3200`；构建时内联，修改后需重新构建 |
| `NEXT_OUTPUT_DIR` | Next.js 构建目录，相对于 `web/`，默认 `.next` |

其他配置见 [.env.example](https://github.com/AlbaTextus/atnexus/blob/main/.env.example) 和 [配置实现](https://github.com/AlbaTextus/atnexus/blob/main/internal/config/config.go)。修改代理后端地址时，生产前端需要重新构建，以更新 rewrites。

## 补充变量

下面这些变量同样由 Go 服务读取，默认值见 `.env.example`。时长写成 `15s`、`10m` 这样的形式；数值或时长格式错误会阻止启动，不会悄悄改用默认值。

| 变量 | 用途 |
| --- | --- |
| `OAUTH_HTTP_ADDR` | OAuth 监听地址，设置后优先于 `HTTP_ADDR` |
| `CREATPLAT_DATABASE_URL` | 必填，独立创作者库；不回退到 `DATABASE_URL`，见[创作者平台数据库](/creatplat/database) |
| `CREATPLAT_MIGRATION_CHECK_TIMEOUT` | 启动时核对旧审核、历史数据的期限，默认 `10m`，必须为正 |
| `TRUSTED_PROXY_CIDRS` | 允许提供 `X-Forwarded-For` 的反向代理网段，逗号分隔，默认 `127.0.0.1/32,::1/128`；入口代理不经回环地址连接时需加入它的网段 |
| `HTTP_REQUEST_TIMEOUT` | 普通请求期限，默认 `15s`，必须为正 |
| `HTTP_SHUTDOWN_TIMEOUT` | 停止服务时等待在途请求的期限，默认 `10s`，必须为正 |
| `BCRYPT_COST` | 密码哈希强度，默认 `12`，取值 10 至 15 |
| `WEBAUTHN_RP_NAME` | Passkey 显示的站点名称，默认 `ALBATEXTUS` |
| `IMGBED_URL`、`IMGBED_API_TOKEN` | 头像、封面和插图上传使用的图床地址与上传 Key，只在服务端使用 |
| `NEXT_PUBLIC_ATHUB_API_URL` | 浏览器直连 ATHub 的公开地址，本地为 `http://localhost:8005`；前端构建前配置 |
| `NEXT_PUBLIC_CREDIT_URL` | 积分服务地址，本地默认 `http://localhost:3300`；前端构建前配置 |

按功能分组的变量在对应文档中说明：

- `SMTP_*`：见[邮箱认证](/oauth/email)。
- `TURNSTILE_*`、`GITHUB_*`、`LINUXDO_*`、`CUSTOM_OAUTH_*`：见[登录与账户](/oauth/login)。
- `IMAGE_*`：见[图床配置](/image/config)。
- 仅 Docker Compose 使用的变量：见 [Docker Compose](/deploy/docker)。
