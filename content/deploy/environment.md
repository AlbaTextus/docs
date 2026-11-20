# 环境变量

Go 服务从仓库根目录 `.env` 加载配置，已有进程环境变量优先。前端变量需单独通过 `web/.env.local` 或 Next.js 的进程环境配置。

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接地址，必填 |
| `ATHUB_DATABASE_URL` | 内容库 PostgreSQL 连接地址，必填，与账户库分开 |
| `CLIENT_SECRET_ENCRYPTION_KEY` | 客户端密钥与 PKCE verifier 加密密钥，必填并保持稳定 |
| `APP_ENV` | 本地为 `development`，生产为 `production` |
| `GATEWAY_HTTP_ADDR` | 唯一的后端 HTTP 监听地址，默认 `:8010`；按路径前缀分发到五个模块，见[聚合端口](/deploy/production) |
| `IMAGE_DATABASE_URL` | 必填，独立图床 PostgreSQL 数据库 |
| `IMAGE_LOCAL_ROOT` | 必填，已有图床文件目录 |
| `IMAGE_PUBLIC_URL` | 图床公开根地址，本地默认 `http://localhost:8010` |
| `ISSUER_URL` | 对外 OAuth 地址；本地应为 `http://localhost:3288` |
| `AUTH_UI_URL` | 认证前端对外地址 |
| `COOKIE_SECURE` | HTTPS 部署设为 `true` |
| `SESSION_TTL` | 中心会话有效期，默认 `24h` |
| `SESSION_COOKIE_NAME` | 中心会话 Cookie 名称，默认 `albatextus_session` |
| `LOGIN_FAILURE_LIMIT` | 同一地址对同一邮箱在窗口内允许的密码登录失败次数，默认 `10`；单个邮箱合计为 3 倍、单个地址合计为 5 倍，`0` 关闭限速 |
| `LOGIN_FAILURE_WINDOW` | 登录失败计数窗口，默认 `15m` |
| `AUTHORIZATION_CODE_TTL` | 授权码有效期，默认 `5m` |
| `WEBAUTHN_RP_ID` | Passkey 所属域名，不带协议和端口 |
| `WEBAUTHN_RP_ORIGINS` | 允许的完整前端 Origin，逗号分隔 |
| `PASSKEY_CHALLENGE_TTL` | Passkey 挑战有效期，默认 `5m` |
| `OAUTH_BACKEND_URL` | Next.js 转发账户、OAuth 和邮件（`/api/v3`）请求的后端地址，默认 `http://localhost:8010` |
| `CREATPLAT_BACKEND_URL` | Next.js 转发创作者操作的后端地址，默认 `http://localhost:8010` |
| `NEXT_PUBLIC_ATHUB_API_URL` | 浏览器直连内容接口的公开地址，本地填写 `http://localhost:8010`；前端构建前配置 |
| `NEXT_PUBLIC_CREATPLAT_API_URL` | 浏览器直连历史查询的公开地址，本地填写 `http://localhost:8010`；前端构建前配置 |
| `NEXT_OUTPUT_DIR` | Next.js 构建目录，相对于 `web/`，默认 `.next` |

其他配置见 [.env.example](https://github.com/AlbaTextus/atnexus/blob/main/.env.example) 和 [配置实现](https://github.com/AlbaTextus/atnexus/blob/main/internal/config/config.go)。修改代理后端地址时，生产前端需要重新构建，以更新 rewrites。

升级后可删除旧 `.env` 中的 `HTTP_ADDR`、`OAUTH_HTTP_ADDR`、`ATHUB_HTTP_ADDR`、`CREATPLAT_HTTP_ADDR`、`IMAGE_HTTP_ADDR` 和 `IMAGE_LEGACY_HTTP_ADDR`；新版不再读取这些监听变量。`NEXT_PUBLIC_WIKI_URL`、`CREATPLAT_MIGRATION_CHECK_TIMEOUT` 和 `IMAGE_LEGACY_SQLITE` 同样不再读取，可以一并删除。

## 补充变量

下面这些变量同样由 Go 服务读取，默认值见 `.env.example`。时长写成 `15s`、`10m` 这样的形式；数值或时长格式错误会阻止启动，不会悄悄改用默认值。

| 变量 | 用途 |
| --- | --- |
| `CREATPLAT_DATABASE_URL` | 必填，独立创作者库；不回退到 `DATABASE_URL`，见[创作者平台数据库](/creatplat/database) |
| `ATHUB_CALL_LOG_RETENTION` | 不带个人 Key 的 ATHub 调用记录（未登录请求和网站会话请求）的保留时间，默认 `720h`，到期后由定时清理任务分批删除；`0` 表示永久保留，不可为负。带个人 Key 的调用记录用于用量统计，始终保留 |
| `TRUSTED_PROXY_CIDRS` | 允许提供 `X-Forwarded-For` 的反向代理网段，逗号分隔，默认 `127.0.0.1/32,::1/128`；入口代理不经回环地址连接时需加入它的网段 |
| `HTTP_REQUEST_TIMEOUT` | 普通请求期限，默认 `15s`，必须为正；创作者平台和 ATHub 接口的期限不低于 `30s`。超过期限的请求返回 `503` 和 JSON `{"error":"server_timeout"}`。图床接口不使用这一项，见[图床配置](/image/config)的 `IMAGE_HTTP_TIMEOUT` |
| `HTTP_SHUTDOWN_TIMEOUT` | 停止服务时等待在途请求的期限，默认 `10s`，必须为正 |
| `BCRYPT_COST` | 密码哈希强度，默认 `12`，取值 10 至 15 |
| `WEBAUTHN_RP_NAME` | Passkey 显示的站点名称，默认 `ALBATEXTUS` |

按功能分组的变量在对应文档中说明：

- `SMTP_*`：见[邮件模块](/mail/overview)。
- `TURNSTILE_*`、`GITHUB_*`、`LINUXDO_*`、`CUSTOM_OAUTH_*`：见[登录与账户](/oauth/login)。
- `IMAGE_*`：见[图床配置](/image/config)。
- 仅 Docker Compose 使用的变量：见 [Docker Compose](/deploy/docker)。
