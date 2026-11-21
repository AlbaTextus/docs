# 接口一览

账户与 OAuth 路由以 [modules/oauth/api/api.go](https://github.com/AlbaTextus/atnexus/blob/main/modules/oauth/api/api.go) 为准；
创作路由见 [modules/creatplat/api/api.go](https://github.com/AlbaTextus/atnexus/blob/main/modules/creatplat/api/api.go)，
内容路由见 [ATHub 模块接口](/athub/overview)。
以下路径中的 `{id}`、`{provider}` 为参数。

## OAuth 与公开接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/v1/healthz` | 正常返回 200；维护开启返回 433（status=maintenance）；数据库或维护状态读取失败返回 503 |
| GET | `/.well-known/oauth-authorization-server` | OAuth 元数据 |
| GET | `/oauth/authorize` | 发起授权码流程 |
| POST | `/oauth/token` | 换取、刷新令牌或使用客户端凭证 |
| POST | `/oauth/revoke` | 撤销令牌 |
| POST | `/oauth/introspect` | 查询令牌状态 |
| GET | `/api/v1/auth/providers` | 第三方平台开放状态 |
| GET | `/api/v1/auth/verification` | Turnstile 公开配置 |
| GET | `/api/v1/profiles/{id}` | 用户公开资料 |

## 认证与个人账户

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/v1/users` | 注册 |
| POST | `/api/v1/sessions` | 密码登录 |
| DELETE | `/api/v1/sessions/current` | 退出当前会话 |
| GET | `/api/v1/session` | 当前 session 到期时间及缓存隔离标识，不返回凭证明文 |
| GET | `/api/v1/user` | 当前账户或 Bearer 用户身份 |
| POST | `/api/v1/auth/providers/{provider}/start` | 开始第三方登录或绑定 |
| GET | `/api/v1/auth/providers/{provider}/callback` | 第三方回调 |
| GET / DELETE | `/api/v1/account/identities` / `/api/v1/account/identities/{provider}` | 列出或解绑第三方账号 |
| PATCH | `/api/v1/account/profile` | 更新昵称 |
| POST | `/api/v1/account/setup` | 注册后完成首次用户名设置，见[邮件模块](/mail/overview) |
| PATCH | `/api/v1/account/bio` | 更新个人简介 |
| POST / DELETE | `/api/v1/account/background` | 上传 / 移除个人主页背景 |
| PATCH | `/api/v1/account/avatar` | 更改头像来源 |
| POST | `/api/v1/account/avatar` | 上传自定义头像 |
| POST | `/api/v1/account/avatar/preview` | 返回 GIF 头像的裁剪预览，不保存 |
| POST | `/api/v1/account/password` | 设置或修改密码 |
| POST | `/api/v1/passkeys/registration/options`、`/api/v1/passkeys/registration/finish` | 注册通行密钥 |
| POST | `/api/v1/passkeys/login/options`、`/api/v1/passkeys/login/finish` | 通行密钥登录 |
| GET / DELETE | `/api/v1/passkeys` / `/api/v1/passkeys/{id}` | 列出或删除通行密钥 |
| GET / POST | `/api/v1/oauth/consent` | 读取与提交应用授权确认 |

账户管理接口使用中心登录会话。第三方登录发起、账户修改、应用授权决定等请求需携带 `X-AlbaTextus-Client: account-center`；Passkey 完成接口使用 `X-WebAuthn-Ceremony`。开启 Turnstile 后，注册相关请求与密码登录还需有效的 `X-Turnstile-Token`；第三方登录和 Passkey 登录不需要该令牌。

## 管理接口

管理接口要求管理员会话，不能用应用的 Bearer Token 替代。写入及读取客户端密钥需要 `X-AlbaTextus-Client: account-center`，并接受来源校验。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET / POST | `/api/v1/applications` | 应用列表 / 创建 |
| GET / PUT / DELETE | `/api/v1/applications/{id}` | 应用详情 / 更新 / 删除 |
| PATCH | `/api/v1/applications/{id}/status` | 启用 / 停用应用 |
| GET / POST | `/api/v1/applications/{id}/secret` | 查看 / 重置客户端密钥 |
| GET / POST | `/api/v1/admin/users` | 用户列表 / 创建 |
| PATCH | `/api/v1/admin/users/{id}` | 修改昵称、角色与启停状态 |
| POST | `/api/v1/admin/users/{id}/password` | 重置用户密码 |
| POST | `/api/v1/admin/users/{id}/revoke-sessions` | 撤销用户登录与授权 |
| GET / PATCH | `/api/v1/admin/features` | 读取 / 更新站点功能开关 |

用户列表支持 `q`、`role`、`status`、`page`、`page_size`；更新用户需提交读到的 `updated_at`。版本冲突会返回 `409`，应重新读取后编辑。

## 其他接口

- 个人 Key、调用记录与等级权限接口见 [ATHub 密钥与权限](/oauth/athub-key)。
- 邮箱验证码与邮箱变更接口已移到 `/api/v3`，见[邮件模块](/mail/overview)。
- 站点功能开关与维护接口见[站点开关与维护](/oauth/site)。
- 图床 Key 的管理接口 `/api/v1/admin/image/keys` 见[图床文档](/image/overview)。
