# 邮件模块

本模块负责 SMTP 发信、邮箱验证码，以及验证、绑定和更换账户邮箱。统一服务在聚合入口（默认 `8010`，由 `GATEWAY_HTTP_ADDR` 配置）提供 `/api/v3/*`。

注册账户必须验证邮箱；账号中心的「账户安全」支持验证、绑定和更换邮箱。注册提交本身仍由 [OAuth 模块](/oauth/overview)的 `POST /api/v1/users` 处理，它消费本模块签发的验证码。

## 与 OAuth 模块的边界

邮件模块不单独建库，也不保存另一份账户规则：

- 验证码、发信限速和账户邮箱都保存在账户库，沿用原有迁移链。
- 登录态使用同一个 session Cookie；账号中心接口同样要求账号中心请求头。
- 注册开关、Turnstile 人机验证和维护模式由 OAuth 模块判定，本模块直接沿用其结果，见[站点开关与维护](/oauth/site)。维护期间只有超级管理员可以调用 `/api/v3` 的业务接口，健康检查不受影响。

源码位于 `modules/mail/`：根目录是 SMTP 发信与邮件模板，`api/` 是 `/api/v3` 的 HTTP 接口。

## SMTP 配置

邮件仅通过 SMTP 发送，在 Go 服务的 `.env` 中配置：

```dotenv
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-smtp-auth-code
# SMTP_FROM=noreply@example.com
```

`SMTP_FROM` 留空默认使用 `SMTP_USER`。QQ 邮箱需先开启 SMTP，并填写授权码。端口 587 强制 STARTTLS，465 默认使用 TLS；也可以用 `SMTP_SECURE` 显式指定直接 TLS，服务端始终验证证书。发送超时为 10 秒。配置不完整会阻止启动；全部留空时暂停邮箱注册和验证，已有账户登录及第三方登录不受影响。

上线前执行 `pnpm db:deploy` 应用邮箱验证迁移，再重启后端。存量账户默认标记为未验证，可在账户安全页面补验；已有密码登录继续可用。第三方新建账户只有上游明确证明邮箱已验证时才继承验证状态，LINUX DO 的专属登录标识不视为邮箱。

## 验证码规则

验证码为 6 位随机数字，5 分钟有效，最多尝试 5 次，数据库仅保存带服务端密钥的摘要。每个邮箱 60 秒最多发一次、每小时最多 10 次；账号中心同一账户也受此限制，整个服务每小时最多发 300 次。注册发信与注册提交均经过已配置的 Turnstile，生产环境建议启用。发送失败使本次验证码失效，冷却仍保留；再次发送会替换同场景、同会话、同邮箱的旧验证码。验证码不能跨注册/绑定场景、邮箱或登录会话使用。

更换邮箱需要目标邮箱验证码；有密码的账户还需确认当前密码。成功后保留当前会话，撤销其他设备会话及既有应用令牌。验证当前邮箱不会撤销会话。邮箱验证和账号变更在同一事务内完成。

验证码邮件使用品牌 HTML 模板，并附带纯文本备份。

## 接口

| 接口 | 请求字段 |
| --- | --- |
| `POST /api/v3/auth/email/code` | `email`，返回 `challenge_id`、`expires_in`、`retry_after` |
| `POST /api/v3/account/email/code` | `email`，要求登录及账号中心请求头 |
| `POST /api/v3/account/email` | `email`、`challenge_id`、`code`、`current_password`（有密码时必填），返回更新后的账户信息 |
| `GET /api/v3/healthz` | 账户库可用时返回 200，否则返回 503；未配置 SMTP 不影响结果 |

注册流程中与验证码配合的账户接口仍在 `/api/v1`：

| 接口 | 请求字段 |
| --- | --- |
| `POST /api/v1/users` | `email`、`password`、`challenge_id`、`email_code` |
| `POST /api/v1/account/setup` | 注册后用当前会话提交 `username`，完成首次用户名设置 |

`/api/v1/user` 返回 `email_verified`；OAuth 应用仅在获准 `email` scope 后收到该字段。

常见错误码：`email_unavailable`（503，未配置 SMTP 或发送失败）、`invalid_email`（400）、`invalid_email_code`（400）、`email_rate_limited`（429，带 `Retry-After: 60`）、`email_exists`（409）、`account_changed`（409）、`registration_disabled`（403）。

## 从 `/api/v1` 迁移

验证码接口原先位于 OAuth 模块，现已下线，旧路径返回 404：

| 旧路径 | 新路径 |
| --- | --- |
| `POST /api/v1/auth/email/code` | `POST /api/v3/auth/email/code` |
| `POST /api/v1/account/email/code` | `POST /api/v3/account/email/code` |
| `POST /api/v1/account/email` | `POST /api/v3/account/email` |

请求与响应字段不变。升级时后端与前端需要一起更新：新前端调用 `/api/v3`，旧后端没有这些路径。Next.js 把 `/api/v3/*` 转发到 `OAUTH_BACKEND_URL`；反向代理若按路径放行，需要加入 `/api/v3`，见[聚合端口](/deploy/production)。本次改动没有数据库迁移，也没有新的环境变量。
