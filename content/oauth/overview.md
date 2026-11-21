# 模块概览

本模块负责账户认证、OAuth 授权、第三方登录、Passkey、人机验证，以及外部 API Key 的管理与凭据校验。邮箱验证码与发信已拆到[邮件模块](/mail/overview)（`/api/v3`）。

统一服务在聚合入口（默认 `8010`，由 `GATEWAY_HTTP_ADDR` 配置）提供 `/api/v1/*`。OAuth 协议端点 `/oauth/*` 和发现端点 `/.well-known/*` 保持原路径。

各项能力分别见[登录与账户](/oauth/login)、[邮件模块](/mail/overview)、[应用接入](/oauth/integration)、[ATHub 密钥与权限](/oauth/athub-key)、[站点开关与维护](/oauth/site)和[接口一览](/oauth/api)。

## 路由与凭据

OAuth 使用 `/api/v1/*`，协议端点 `/oauth/*` 和发现端点保持原路径。
ATHub 公开入口为 `/api/v5/*`，创作者平台为 `/api/v4/*`，邮件模块为 `/api/v3/*`。
底层内容引擎、权限配置与历史审计内部仍使用 v2/v3 操作标签，通过边界适配转换；这些标签只在内部使用，与邮件模块公开的 `/api/v3` 无关。

`GET /api/v1/session` 返回 session 到期时间与缓存隔离标识，不返回凭证。浏览器站内请求使用 HttpOnly session Cookie；Key 用于外部调用，两者独立。

本项目提供 OAuth 2.0 服务，**不签发 OpenID Connect ID Token**。访问令牌是不透明字符串；应用通过 `/api/v1/user` 获取用户身份，不应将令牌当作 JWT 解码。

## 源码结构

模块位于 `modules/oauth/`：

- `api/`：账户及外部 Key 管理 HTTP API。
- `protocol/`：OAuth 协议核心。
- `session.go`：其他模块共用的 session 校验权威；每次请求直接核验数据库，撤销立即生效。
- `apikey.go`：外部 API Key 校验权威，保留既有哈希、用户归属与状态规则。
- `repository/apikey.go`：外部 Key 生命周期及校验查询；原账户存储层委托此实现。
- 账户及 Key 数据保存在账户库，schema 位于仓库根目录的 `prisma/oauth/`。

内容权限、额度、调用统计等账户入口暂为过渡实现，归属待定。

## 积分服务

积分、支付、管理调整与 24 小时结算由独立仓库 [AlbaTextus/credit](https://github.com/AlbaTextus/credit) 提供，使用独立数据库；本服务不提供钱包及支付 API，账户中心也没有积分入口。

Credit 在应用管理中注册为机密 OAuth 客户端：回调路径 `/api/v1/auth/callback`，授权类型 `authorization_code`，scope `profile`。
`profile` 用户信息包含稳定 UUID、数字用户编号、昵称、头像及角色；Credit 不接收账户密码或登录 Cookie。
