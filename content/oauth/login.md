# 登录与账户

## 登录流程

新账户创建后进入 `/welcome` 设置用户名，目前只有一个用户名输入框。保存成功后前往用户中心，或继续原先的应用授权流程。用户名作为 `display_name` 展示，登录仍使用邮箱或原有登录方式。未完成的设置会保留，刷新或重新登录后可以继续；第三方首次创建的账户也会进入此步骤并预填上游名称。已有账户不受影响，普通账户完成首次设置后仍遵循原有的昵称修改权限。

登录页采用纯白卡片，顶部 `ALBATEXTUS` 字标在完成 Cloudflare 安全验证后收拢为 `AT`。GitHub、LINUX DO 和通行密钥入口与密码登录共用验证状态，登录不要求点击协议确认。

创建账户页的验证流程为：

1. 配置了 Turnstile 时，先完成 Cloudflare 人机验证，保留片刻成功反馈。
2. 原验证区域显示「同意并继续」，下方标注「隐私政策与用户协议」。
3. 点击同意后收起验证区域，允许继续邮箱验证码注册或使用第三方账号。

未启用 Turnstile 时，登录可直接继续；创建账户页仍要求点击协议确认。验证过期或尝试失败后，需要重新完成对应步骤。

这里的协议确认是创建账户页的交互门槛，当前没有独立的服务端协议签署记录；它与 OAuth 应用授权确认是两个不同流程。本服务不提供协议正文页面，确认区域只显示名称，不带链接；登录页和创建账户页底部也不再列出协议链接。

“记住邮箱”只在登录成功后保存邮箱或登录标识，不保存密码；取消勾选会清除已保存的值。

## 第三方登录

在根目录 `.env` 配置凭据后重启 Go 服务。平台是否开放由后端返回；未配置的平台入口不可点击。

| 平台 | 必要配置 | 本地回调地址 |
| --- | --- | --- |
| GitHub OAuth App | `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` | `http://localhost:3288/api/v1/auth/providers/github/callback` |
| [LINUX DO Connect](https://connect.linux.do/) | `LINUXDO_CLIENT_ID`、`LINUXDO_CLIENT_SECRET` | `http://localhost:3288/api/v1/auth/providers/linuxdo/callback` |
| 自定义 OAuth | `CUSTOM_OAUTH_CLIENT_ID`、`CUSTOM_OAUTH_CLIENT_SECRET` 及端点 URL | `http://localhost:3288/api/v1/auth/providers/custom/callback` |

自定义平台需设置 `CUSTOM_OAUTH_AUTHORIZATION_URL`、`CUSTOM_OAUTH_TOKEN_URL`、`CUSTOM_OAUTH_USERINFO_URL`，支持授权码、S256 PKCE 和 `client_secret_post`。用户信息接口须接受 Bearer Token 并返回 JSON。默认字段为 `sub`、`email`、`email_verified`、`name`、`picture`，可通过 `CUSTOM_OAUTH_*_FIELD` 修改，支持 `data.id` 等点分路径。

平台稳定 ID 用于识别用户；相同邮箱不会自动合并账户或提升角色。已有账户应先登录，再到「账户安全」绑定第三方账号。绑定完成或取消授权后，返回「账户安全」时会显示相应提示。

从小说库发起第三方登录，成功后会回到发起登录的小说库页面；如需先补全资料，则在补全后返回。第三方登录仅接受白名单内的站内回跳地址。

- GitHub 和自定义平台创建新账户时需要已验证邮箱。
- LINUX DO 使用稳定的用户 ID 创建独立账户，内部登录标识属于 `@accounts.albatextus.invalid` 保留域；`email_is_alias=true` 表示它不是收件邮箱。
- 第三方创建的账户可设置首个密码；解绑第三方账号前需要设置密码。
- 平台登录会同步头像，个人资料页可选择自动、默认或某个已绑定平台的头像来源。

第三方凭据仅供 Go 服务使用，不要放入 `NEXT_PUBLIC_*`。正式回调地址应使用 `AUTH_UI_URL` 对应的 HTTPS 域名。已有绑定后，不应把同一个自定义平台配置改指向另一套身份系统。

## 自定义头像与图床

选图后会弹出裁剪窗口，可拖动图片、缩放并查看圆形头像范围，支持触屏和方向键调整。确认裁剪后可重新裁剪；取消会保留已有预览，点击「保存头像」才会上传到图床。

在「个人资料 → 我的头像」选择「自定义上传」，选图预览后点击「保存头像」。支持 PNG、JPEG、WebP、GIF，最大 5 MB、1600 万像素；静态图片生成最大 512 × 512 的 PNG，GIF 逐帧裁剪并保留动画、帧间隔和循环次数。GIF 最多 200 帧，各帧完整画面合计不超过 4000 万像素，裁剪结果也不超过 5 MB。裁剪预览接口只返回图片，点击保存才上传图床并更新账户。后端在同一进程内直接保存到图床的 `user/<用户 UUID>/avatars/` 目录，使用账户 UUID，而非页面地址中的数字 ID。用户中心、授权确认页和 OAuth 用户资料同步使用保存后的地址；上传新头像后，上一张自定义头像及其原图会从图床删除，旧链接随之失效，缓存了旧地址的接入应用需重新读取用户资料。切换到平台或默认头像会保留已上传的自定义头像，方便再次选择。

头像和背投上传不需要单独配置图床地址或上传 Key：图床与账户服务在同一进程内，`IMGBED_URL`、`IMGBED_API_TOKEN` 已取消。保存后的地址以 `IMAGE_PUBLIC_URL` 为根，见[图床配置](/image/config)。

## Turnstile

设置 `TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY` 启用验证；两项均为空时关闭，只填写一项会拒绝启动。`TURNSTILE_ALLOWED_HOSTNAMES` 为逗号分隔的精确域名，默认取 `AUTH_UI_URL` 的主机名，不含协议、端口或路径。

本地联调可使用 [Cloudflare 官方测试密钥](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)：

```dotenv
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
TURNSTILE_TEST_MODE=true
```

测试模式不提供真实机器人防护。生产环境需换成自己的密钥并关闭测试模式；`APP_ENV=production` 会拒绝测试模式和官方测试密钥。

Go 服务在注册、密码登录、第三方登录发起、通行密钥登录挑战创建前调用 Siteverify。受保护请求通过 `X-Turnstile-Token` 携带令牌；正式验证检查域名、`action=authenticate`、时效和重复使用。验证服务不可用时不会放行。已登录用户绑定账号及 OAuth 应用换取令牌不额外触发这一验证。

## 页面与权限

用户中心以数字用户 ID 作为路径：`/account/{numeric_id}`，个人资料为 `/account/{numeric_id}/profile`，账户安全为 `/account/{numeric_id}/security`。服务端按登录会话校验路径中的 ID，其他账户（包括管理员）访问这些私人页面返回 404。管理员通过独立的管理后台管理账户。

旧入口 `/account`、`/account/profile`、`/account/security` 会跳转到当前登录用户的数字 ID 路径；未登录先进入登录页。数字 ID 用于页面路由，OAuth 的稳定内部账户标识继续使用原 UUID。

| 页面 | 用途 |
| --- | --- |
| `/` | 公开主页、社区与接入资源入口 |
| `/login`、`/register` | 登录与注册 |
| `/account` | 个人资料概览 |
| `/account/profile` | 修改昵称、选择头像来源 |
| `/account/security` | 密码、通行密钥与第三方账号管理 |
| `/admin/applications` | 应用列表、创建、启停、配置与密钥管理 |
| `/admin/users` | 用户搜索、角色与状态管理、密码重置、撤销登录 |
| `/consent` | OAuth 应用授权确认 |

账户采用四级等级：1 级普通用户（`USER`）、2 级用户（`LEVEL_2`）、3 级管理员（`ADMIN`）、4 级超级管理员（`SUPER_ADMIN`）。用户接口保留 `role`，同时返回由角色确定的数字 `level`（1、2、3、4）。2 级可分配、筛选、设置为应用访问门槛，并单独配置 Key 累计总调用上限，默认不限次；不具备管理后台权限。1、2 级用户管理自己的账户；3 级管理员可管理应用及 1、2 级用户；4 级超级管理员可管理全部角色。管理操作禁止修改自己的角色、停用自己，或通过后台重置自己的密码和撤销自己的登录。开放 2 级需执行 `pnpm db:deploy` 应用数据库迁移；迁移保留已有账户角色及各等级的 Key 限额配置。

修改密码、变更角色、停用账户或撤销登录会使相关中心会话与 OAuth 凭据失效。子系统自己建立的本地会话需要由子系统处理失效与退出。
