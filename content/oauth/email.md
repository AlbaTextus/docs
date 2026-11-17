# 邮箱认证（SMTP）

注册账户必须验证邮箱；账号中心的「账户安全」支持验证、绑定和更换邮箱。邮件仅通过 SMTP 发送，在 Go 服务的 `.env` 中配置：

```dotenv
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-smtp-auth-code
# SMTP_FROM=noreply@example.com
```

`SMTP_FROM` 留空默认使用 `SMTP_USER`。QQ 邮箱需先开启 SMTP，并填写授权码。端口 587 强制 STARTTLS，465 默认使用 TLS；也可以用 `SMTP_SECURE` 显式指定直接 TLS，服务端始终验证证书。发送超时为 10 秒。配置不完整会阻止启动；全部留空时暂停邮箱注册和验证，已有账户登录及第三方登录不受影响。

上线前执行 `pnpm db:deploy` 应用邮箱验证迁移，再重启后端。存量账户默认标记为未验证，可在账户安全页面补验；已有密码登录继续可用。第三方新建账户只有上游明确证明邮箱已验证时才继承验证状态，LINUX DO 的专属登录标识不视为邮箱。

验证码为 6 位随机数字，5 分钟有效，最多尝试 5 次，数据库仅保存带服务端密钥的摘要。每个邮箱 60 秒最多发一次、每小时最多 10 次；账号中心同一账户也受此限制，整个服务每小时最多发 300 次。注册发信与注册提交均经过已配置的 Turnstile，生产环境建议启用。发送失败使本次验证码失效，冷却仍保留；再次发送会替换同场景、同会话、同邮箱的旧验证码。验证码不能跨注册/绑定场景、邮箱或登录会话使用。

更换邮箱需要目标邮箱验证码；有密码的账户还需确认当前密码。成功后保留当前会话，撤销其他设备会话及既有应用令牌。验证当前邮箱不会撤销会话。邮箱验证和账号变更在同一事务内完成。

| 接口 | 请求字段 |
| --- | --- |
| `POST /api/v1/auth/email/code` | `email`，返回 `challenge_id`、`expires_in`、`retry_after` |
| `POST /api/v1/users` | `email`、`password`、`challenge_id`、`email_code` |
| `POST /api/v1/account/setup` | 注册后用当前会话提交 `username`，完成首次用户名设置 |
| `POST /api/v1/account/email/code` | `email`，要求登录及账号中心请求头 |
| `POST /api/v1/account/email` | `email`、`challenge_id`、`code`、`current_password`（有密码时必填） |

`/api/v1/user` 返回 `email_verified`；OAuth 应用仅在获准 `email` scope 后收到该字段。
