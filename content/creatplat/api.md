# 接口一览

创作者平台的接口挂在 `8004` 的 `/api/v4/` 下，路由定义以 [modules/creatplat/api/api.go](https://github.com/AlbaTextus/atnexus/blob/main/modules/creatplat/api/api.go) 为准。投稿、编辑和审核操作由网站页面通过 Next.js 转发；历史与贡献者查询由浏览器直连。

## 接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/healthz` | 创作者库和账户库都可用时返回 `{"status":"ok"}`，否则返回 503 |
| GET | `/api/v4/history?novelId=2&limit=20&offset=0` | 分页读取一部作品的变更历史 |
| GET | `/api/v4/contributors?novelId=2` | 读取作品的创建者与后续贡献者 |
| POST | `/api/v4/account/athub/submissions` | 提交小说 |
| GET | `/api/v4/account/athub/submissions` | 自己的提交列表 |
| GET | `/api/v4/account/athub/submissions/{id}` | 自己某次提交的状态与结果 |
| PUT | `/api/v4/account/athub/novels/{id}` | 修改作品资料 |
| POST | `/api/v4/account/athub/cover` | 上传封面图片 |
| POST | `/api/v4/account/athub/novels/{id}/illustrations` | 上传一张插图 |
| DELETE | `/api/v4/account/athub/novels/{id}/illustrations/{illustrationId}` | 删除一张插图 |
| PUT | `/api/v4/account/athub/novels/{id}/illustration-layout` | 保存插图布局 |
| GET | `/api/v4/admin/athub/reviews` | 审核列表 |
| GET | `/api/v4/admin/athub/reviews/{id}` | 单条审核详情 |
| POST | `/api/v4/admin/athub/reviews/{id}` | 通过或驳回一条审核 |

## 鉴权

- `/api/v4/account/*` 和 `/api/v4/admin/*` 使用网站登录会话；提交小说时会话 Cookie 缺失、过期或已撤销返回 `401 login_required`。
- `/api/v4/admin/*` 还要求管理员账户，其他账户会被拒绝。
- `/api/v4/history` 与 `/api/v4/contributors` 接受网站会话或个人 Key。
- 修改请求校验客户端标记与来源；`8004` 允许配置的账户页面来源携带 Cookie 跨端口访问。
- 每项操作仍受账户等级的接口权限约束，见 [ATHub 密钥与权限](/oauth/athub-key)。

## 提交与审核列表

`GET /api/v4/account/athub/submissions` 返回自己的提交，`GET /api/v4/admin/athub/reviews` 返回全部提交。两者只接受下面两个查询参数，各自最多出现一次；出现其他参数返回 `400 invalid_review_query`。

| 查询键 | 说明 |
| --- | --- |
| `status` | 可选，`pending`、`approved`、`rejected` 或 `failed`；其他值返回 `400 invalid_review_status`。 |
| `offset` | 可选，`0` 至 `1000000` 的整数；超出范围返回 `400 invalid_offset`。 |

路径中的 `{id}` 是审核 ID（UUID）；格式不正确返回 `400 invalid_review_id`。

## 审核决定

`POST /api/v4/admin/athub/reviews/{id}` 提交：

```json
{
  "decision": "reject",
  "note": "章节顺序与来源不一致，请核对后重新提交。"
}
```

| 请求键 | 说明 |
| --- | --- |
| `decision` | 必填，`approve` 通过或 `reject` 驳回。 |
| `note` | 审核说明，去除首尾空白后最多 1000 个字符；驳回时必填。 |

字段不合法返回 `400 invalid_decision`。成功返回 `200` 和处理后的审核记录。通过后才把原提交写入正式内容库；审核者不能处理自己的提交，也不能借审核执行自己无权进行的操作。同一条审核被重复或并发处理时，内容不会重复写入。

## 封面上传

`POST /api/v4/account/athub/cover` 使用 `multipart/form-data`，只接受一个 `file` 字段，图片不超过 5 MiB。成功返回 `200`：

```json
{
  "url": "https://img.example.com/file/book/10/covers/cover.jpg"
}
```

返回的地址再作为小说元信息的 `coverUrl` 提交。图片不是有效图片或超出限制返回 `400 cover_invalid`；图床未配置或暂不可用返回 `503 cover_upload_unavailable`；图床上传失败返回 `502 cover_upload_failed`。

## 插图

插图上传同样使用 `multipart/form-data` 的单个 `file` 字段，每次一张。上传、删除和布局保存分别复用 ATHub `/api/v5/illustrations`、`/api/v5/illustration-layout` 的权限、审核和贡献历史；布局版本过期返回 `409`。流程说明见[投稿、编辑与审核](/creatplat/workflow)，字段与限制见 [ATHub 插图接口](/athub/illustrations-create)。
