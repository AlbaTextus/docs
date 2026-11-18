# 接口一览

创作者平台的接口位于聚合入口（默认 `8010`）的 `/api/v4/` 下，路由定义以 [modules/creatplat/api/api.go](https://github.com/AlbaTextus/atnexus/blob/main/modules/creatplat/api/api.go) 为准。网站通过 Next.js 转发投稿、编辑和审核操作，历史、贡献者和插图查询由浏览器直连。封面上传、插图上传及插图和布局查询也接受个人 Key。

## 接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/v4/healthz` | 创作者库和账户库都可用时返回 `{"status":"ok"}`，否则返回 503 |
| GET | `/api/v4/history?novelId=2&limit=20&offset=0` | 分页读取一部作品的变更历史 |
| GET | `/api/v4/history?novelId=2&revision={id}&limit=100&offset=0` | 分页读取其中一条历史的全部变更 |
| GET | `/api/v4/contributors?novelId=2` | 读取作品的创建者与后续贡献者 |
| POST | `/api/v4/account/athub/submissions` | 提交小说 |
| GET | `/api/v4/account/athub/submissions` | 自己的提交列表 |
| GET | `/api/v4/account/athub/submissions/{id}` | 自己某次提交的状态与结果 |
| PUT | `/api/v4/account/athub/novels/{id}` | 修改作品资料 |
| POST | `/api/v4/account/athub/cover` | 上传封面图片；接受网站会话或个人 Key |
| GET | `/api/v4/account/athub/novels/{id}/illustrations` | 分页读取插图 |
| POST | `/api/v4/account/athub/novels/{id}/illustrations` | 上传一张插图；接受网站会话或个人 Key |
| DELETE | `/api/v4/account/athub/novels/{id}/illustrations/{illustrationId}` | 删除一张插图 |
| GET | `/api/v4/account/athub/novels/{id}/illustration-layout` | 读取布局和当前版本 |
| PUT | `/api/v4/account/athub/novels/{id}/illustration-layout` | 保存插图布局 |
| GET | `/api/v4/admin/athub/reviews` | 审核列表 |
| GET | `/api/v4/admin/athub/reviews/{id}` | 单条审核详情 |
| POST | `/api/v4/admin/athub/reviews/{id}` | 通过或驳回一条审核 |

## 鉴权

- `/api/v4/account/*` 和 `/api/v4/admin/*` 使用网站登录会话；提交小说时会话 Cookie 缺失、过期或已撤销返回 `401 login_required`。
- `/api/v4/admin/*` 还要求管理员账户，其他账户会被拒绝。
- 历史、贡献者、插图列表和插图布局的 `GET` 请求接受网站会话或个人 Key。
- 历史和贡献者中的头像是账户当前的头像，账户已不存在时保留记录时的地址。
- 历史列表把同一账户连续的修改合并为一条。每条的 `changes` 最多带前 100 处变更，且不含章节正文差异 `bodyDiff`；`changeCount` 是这一条的变更总数，`changeStats` 按 `entity`、`action` 给出各类变更的数量。
- 需要完整变更时带上 `revision`（列表中该条的 `id`）逐页读取，返回 `{ "changes": [...], "total": n }`，按修改先后排列并包含 `bodyDiff`；`limit` 取 1 至 100，默认 20。`revision` 不是 UUID 返回 `400 invalid_revision`，这部作品没有这条历史返回 `404 revision_not_found`。
- 封面上传和插图上传也接受个人 Key，见下文「用个人 Key 上传」。删除插图、保存布局及其余 `/api/v4/account/*` 接口只接受网站登录会话。
- 以网站会话发起的修改请求校验客户端标记与来源；聚合入口允许配置的账户页面来源携带 Cookie 跨端口访问。
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

返回的地址再作为小说元信息的 `coverUrl` 提交。作品换用新封面后，旧封面文件在不再被使用时会从图床删除，之后再提交旧地址会被内容接口拒绝（`422`）。图片不是有效图片或超出限制返回 `400 cover_invalid`；封面上传暂不可用返回 `503 cover_upload_unavailable`；保存到图床失败返回 `502 cover_upload_failed`。

接受 JPG、PNG、WebP、GIF（GIF 取首帧），单边不超过 8192 像素、总像素不超过 1600 万。保存前去除元数据，按原比例缩小到最长边 1600 像素以内并转为 JPEG，透明区域填白底。

封面按账户等级的「上传 / 新建 · 封面」权限判断，网站会话和个人 Key 都适用；没有单独设置时跟随该等级的上传总开关，不允许时返回 `403 operation_forbidden`。这个接口只保存图片文件，不修改作品内容，所以不进入审核，也不产生变更历史。

## 插图

### 上传并关联

`POST /api/v4/account/athub/novels/{id}/illustrations` 接收 `multipart/form-data` 的单个 `file` 字段，每次一张。`{id}` 是作品 ID，请求不带查询参数。**一次上传就完成存图和登记，不需要再调用其他接口。** 直接生效时返回 `201` 和插图对象；需要审核时返回 `202` 和 `{"status":"pending","review_id":"…"}`，审核通过后才关联到作品；被驳回或通过时被拒绝的，已保存的图片会从图床删除。同一作品重复上传同一张图片时返回已有的插图对象，不保留新文件。

```json
{
  "id": 40,
  "novelId": 10,
  "url": "https://img.example.com/file/book/10/illustrations/illustration-1.jpg",
  "sha256": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "width": 1200,
  "height": 1800,
  "createdAt": "2026-10-29T04:00:00Z"
}
```

`sha256`、宽高均以服务器归一化后的图片为准。同一作品内，相同校验值只登记一条记录，重复上传返回已存在的记录。图片格式和尺寸限制见 [ATHub 模块与数据库](/athub/module)。

作品 ID 无效或带有查询参数返回 `400 invalid_novel_id`；图片无效或超出限制返回 `400 illustration_invalid`；直接生效的上传遇到不存在的作品返回 `404`；插图上传暂不可用返回 `503 illustrations_unavailable`；图床保存失败返回 `502 illustration_upload_failed`。

### 列表和删除

- `GET /api/v4/account/athub/novels/{id}/illustrations?limit=100&offset=0` 返回插图对象数组，按插图 ID 升序。只允许 `limit` 和 `offset`；没有插图或该页为空时返回 `[]`，作品不存在返回 `404`。
- `DELETE /api/v4/account/athub/novels/{id}/illustrations/{illustrationId}` 不带查询参数或请求体。直接生效时返回 `204`，需要审核时返回 `202`。删除只解除插图与作品的关联，不删除图床文件。如果布局引用了该图，删除生效时会一并移除对应布局块，并将版本号加一。

### 读取和保存布局

`GET /api/v4/account/athub/novels/{id}/illustration-layout` 不带查询参数，返回 `200` 和布局。从未保存过布局时返回 `{"novelId":10,"blocks":[],"revision":0}`。

`PUT /api/v4/account/athub/novels/{id}/illustration-layout` 不带查询参数，提交完整布局并整体替换：

```json
{
  "novelId": 10,
  "blocks": [{ "imageId": 40, "x": 0, "y": 0, "width": 480, "height": 720 }],
  "revision": 1
}
```

- `novelId` 必须与路径中的作品 ID 一致；`revision` 使用读取时的版本号。
- `blocks` 最多 500 项，清空时提交 `[]`。`imageId` 必须属于该作品，同一布局内不得重复。
- `x`、`y` 为非负坐标，`width`、`height` 为正数，长边至少 40；布局块必须在 `1000 × 5000` 的画布内。数值使用画布单位，不是图片像素。
- 直接保存返回 `200` 和新版本的布局；需要审核返回 `202`。版本过期返回 `409`，应重新读取再保存。

上传、删除和布局保存沿用原有账户等级权限、审核和贡献历史，见[投稿、编辑与审核](/creatplat/workflow)。旧 `v5` 插图与布局路径返回 `404`，不再提供只提交图片 URL 的关联接口。

## 用个人 Key 上传

封面上传和插图上传除了网站登录会话，还接受 ATHub 个人 Key，供服务端程序或采集脚本直接上传图片文件。请求格式、图片限制和成功响应与上面两节相同，凭据改为 `Authorization: Bearer <api_key>`。下面以本地聚合端口 `8010` 为例：

```bash
curl --request POST 'http://127.0.0.1:8010/api/v4/account/athub/cover' \
  --header "Authorization: Bearer $ATHUB_API_TOKEN" \
  --form 'file=@cover.jpg'
```

```bash
curl --request POST 'http://127.0.0.1:8010/api/v4/account/athub/novels/10/illustrations' \
  --header "Authorization: Bearer $ATHUB_API_TOKEN" \
  --form 'file=@illustration.jpg'
```

示例中的作品 ID `10` 是占位值，调用时换成真实的作品 ID。

- 请求带有 `Authorization` 请求头就按 Key 调用处理：不读取 Cookie，也不需要 `X-AlbaTextus-Client`。Key 无效时不会改用同一请求里的登录会话。
- Key 格式不对、不存在、已停用或已被重置，以及账户被封禁或被管理员禁用 Key 时，返回 `401 invalid_api_key`；账户等级不允许该操作返回 `403 operation_forbidden`；Key 累计调用次数达到上限返回 `429 api_key_total_call_limit_reached`。账户库无法核对 Key 或无法开始记录时返回 `503`。
- 先核对 Key、额度和权限，再读取图片：被拒绝的调用不会在图床留下文件。
- 调用写入 ATHub 调用记录并计入 Key 的累计次数。界面按 `/api/v4` 路径展示。Key 通过核对后才发现的问题（如作品 ID 无效、图片不合格、图床保存失败）同样计一次调用。
- 封面按「上传 / 新建 · 封面」判断，不进入审核。插图沿用「上传 / 新建 · 插图」的权限、审核和贡献历史。

`/api/v4` 由创作者平台提供，可以直接访问聚合端口 `8010`，也可经账户前端的 `/api/v4/*` 转发到达。若 API 域名按路径放行，需允许 `/api/v4`，见[生产部署与升级](/deploy/production)。接口面向服务端程序：请求带有不在允许列表中的 `Origin` 时返回 `403 invalid_origin`。
