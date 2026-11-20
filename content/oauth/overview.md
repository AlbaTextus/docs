# 模块概览

本模块负责账户认证、OAuth 授权、第三方登录、Passkey、人机验证，以及外部 API Key 的管理与凭据校验。邮箱验证码与发信已拆到[邮件模块](/mail/overview)（`/api/v3`）。

统一服务在聚合入口（默认 `8010`，由 `GATEWAY_HTTP_ADDR` 配置）提供 `/api/v1/*`。OAuth 协议端点 `/oauth/*` 和发现端点 `/.well-known/*` 保持原路径。

各项能力分别见[登录与账户](/oauth/login)、[邮件模块](/mail/overview)、[应用接入](/oauth/integration)、[ATHub 密钥与权限](/oauth/athub-key)、[站点开关与维护](/oauth/site)和[接口一览](/oauth/api)。

## 路由与凭据

OAuth 使用 `/api/v1/*`，协议端点 `/oauth/*` 和发现端点保持原路径。
ATHub 公开入口改为 `/api/v5/*`，创作者平台为 `/api/v4/*`，邮件模块为 `/api/v3/*`。
底层内容引擎、权限配置与历史审计的 v2/v3 操作标签暂保留，通过边界适配转换；这些标签只在内部使用，与邮件模块公开的 `/api/v3` 无关。
这不表示 image 使用了旧内容接口，也不创建新的 library 模块。

`GET /api/v1/session` 返回 session 到期时间与缓存隔离标识，不返回凭证。浏览器站内请求使用 HttpOnly session Cookie；Key 用于外部调用，两者独立。

本项目提供 OAuth 2.0 服务，**不签发 OpenID Connect ID Token**。访问令牌是不透明字符串；应用通过 `/api/v1/user` 获取用户身份，不应将令牌当作 JWT 解码。

## 源码结构

模块位于 `modules/oauth/`：

- `api/`：账户及外部 Key 管理 HTTP API。
- `protocol/`：OAuth 协议核心。
- `session.go`：其他模块共用的 session 校验权威；每次请求直接核验数据库，撤销立即生效。
- `apikey.go`：外部 API Key 校验权威，保留既有哈希、用户归属与状态规则。
- `repository/apikey.go`：外部 Key 生命周期及校验查询；原账户存储层委托此实现。
- 账户及 Key 数据继续使用原账户库和迁移链，本轮不搬迁物理数据。

内容权限、额度、调用统计等旧账户入口暂保留过渡实现，其进一步迁移需明确归属。

## 服务拆分

本仓库曾使用 `AlbaTextus/connect`、`AlbaTextus/oauth` 名称，现统一命名为
`AlbaTextus/atnexus`，负责账户、认证、OAuth 授权与 ATHub 内容存储。
积分、支付、管理调整与 24 小时结算已迁移至独立仓库 [AlbaTextus/credit](https://github.com/AlbaTextus/credit)，使用独立数据库。
账户中心不再提供积分入口和旧支付页面的跳转。
钱包及支付 API 不再由本服务提供；调用方应切换到 Credit。

Credit 在应用管理中注册为机密 OAuth 客户端：回调地址 `http://localhost:3300/api/v1/auth/callback`，
授权类型 `authorization_code`，scope `profile`，生产环境将地址换为 Credit 的 HTTPS 域名。
`profile` 用户信息包含稳定 UUID、数字用户编号、昵称、头像及角色；Credit 不接收账户密码或登录 Cookie。

历史迁移文件保持原样，升级使用 `pnpm db:deploy`。旧钱包与支付表（`wallets`、`wallet_entries`、
`wallet_settlements`、`payment_orders`）曾保留为只读迁移来源，现由迁移
`20261120000000_drop_retired_tables` 删除，其中的数据不可恢复；仍需要这些数据时，
在执行迁移前备份或完成迁出，见[数据库与迁移](/deploy/database)。
