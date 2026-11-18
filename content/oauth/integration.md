# 应用接入

## 登记客户端

在 `/admin/applications/new` 创建应用，填写名称、主页、回调地址、描述和最低访问角色。回调地址精确匹配，不支持通配符；生产使用 HTTPS，本地回环地址允许 HTTP。

- **服务端应用**使用 Client ID 和 Client Secret。密钥只应保存在应用服务端。
- **公开客户端**没有 Client Secret，授权请求必须使用 S256 PKCE。

新建应用默认允许 `authorization_code` 和 `refresh_token`，提供 `profile`、`email` 权限。客户端类型创建后不可修改。客户端凭证模式需应用自身已配置允许 `client_credentials`；该模式代表应用，不代表登录用户。

## 授权码流程

1. 应用生成随机 `state`、`code_verifier`，保存到自己的会话。
2. 计算 `code_challenge = BASE64URL(SHA256(code_verifier))`，去掉末尾的 `=`。
3. 浏览器跳转至授权端点；账户中心完成登录后展示应用授权确认页。
4. 用户允许后，中心将 `code` 与原始 `state` 返回应用登记的回调地址。拒绝则返回 `error=access_denied`。
5. 应用验证 `state`，用授权码和原始 `code_verifier` 换取令牌。
6. 应用携带访问令牌请求用户信息，以稳定的 `id` / `sub` 建立本地会话。

授权请求示意（各参数均需正确 URL 编码）：

```text
http://localhost:3288/oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REGISTERED_CALLBACK
  &scope=profile%20email
  &state=YOUR_RANDOM_STATE
  &code_challenge=YOUR_S256_CHALLENGE
  &code_challenge_method=S256
```

以下是服务端客户端的 Bash / curl 示例，将占位值替换为应用实际值：

```bash
curl http://localhost:3288/oauth/token \
  --user 'YOUR_CLIENT_ID:YOUR_CLIENT_SECRET' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=AUTHORIZATION_CODE' \
  --data-urlencode 'redirect_uri=YOUR_REGISTERED_CALLBACK' \
  --data-urlencode 'code_verifier=YOUR_ORIGINAL_VERIFIER'

curl http://localhost:3288/api/v1/user \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

公开客户端省略 `--user`，改为提交 `client_id`，并保留 `code_verifier`。授权确认请求约 10 分钟有效，绑定当前用户与登录会话，只能处理一次；每次应用授权都需要用户确认。

用户信息始终包含 `id` / `sub`。申请 `profile` 才返回昵称、头像、角色等资料，申请 `email` 才返回邮箱及登录标识说明。请按需申请权限。

## 刷新、撤销与自省

```bash
curl http://localhost:3288/oauth/token \
  --user 'YOUR_CLIENT_ID:YOUR_CLIENT_SECRET' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode 'refresh_token=YOUR_REFRESH_TOKEN'
```

刷新令牌会轮换，成功后需同时保存新的访问令牌和刷新令牌。只有允许 `refresh_token` 的应用才会获得刷新令牌。撤销使用 `POST /oauth/revoke`，查询令牌状态使用 `POST /oauth/introspect`；两者均提交 `token` 并进行客户端认证。自省要求机密客户端，且只回答签发给本应用的令牌：其他应用的令牌与无效令牌一样返回 `{"active": false}`。

服务元数据位于 `/.well-known/oauth-authorization-server`。客户端密钥重置、回调地址或最低角色变更、应用启停等操作会撤销相关已有令牌与未使用的授权码。
