# 接口一览

创作者平台的接口位于聚合入口（默认 `8010`）的 `/api/v4/` 下，路由定义以 [modules/creatplat/api/api.go](https://github.com/AlbaTextus/atnexus/blob/main/modules/creatplat/api/api.go) 为准。网站通过 Next.js 转发投稿、编辑、审核操作和待合并改动的读取，历史、贡献者和插图查询由浏览器直连。封面上传、插图上传及插图和布局查询也接受个人 Key。

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
| GET | `/api/v4/account/athub/novels/{id}/pending-changes` | 读取待审核提交对这部作品的改动 |
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
- 封面上传和插图上传也接受个人 Key，见下文「用个人 Key 上传」。删除插图、保存布局、读取待合并的改动及其余 `/api/v4/account/*` 接口只接受网站登录会话。
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

字段不合法返回 `400 invalid_decision`。成功返回 `200` 和处理后的审核记录。通过后才把这次提交的改动写入正式内容库：只写入提交实际改动的内容，提交没有改动的内容保持当前的值；提交改动的内容按提交写入，覆盖它在提交之后的其他修改，规则见[投稿、编辑与审核](/creatplat/workflow)。审核者不能处理自己的提交，也不能借审核执行自己无权进行的操作。同一条审核被重复或并发处理时，内容不会重复写入。

通过后的记录带有 `result_status` 和 `result`，是内容接口对这次写入给出的 HTTP 状态码和回复；列表只返回 `result_status`，`result` 在单条详情里。写入成功时 `status` 为 `approved`。内容接口拒绝写入时 `status` 为 `failed`（页面上显示为「生效失败」），正式内容没有变化，`result` 形如 `{"error":"…"}`，`result_status` 的含义与内容接口相同，见[错误与状态码](/athub/errors)，例如 `404` 表示提交涉及的内容已不存在，`422` 表示提交引用的封面或插图已不在图床。

`result_status` 另有一个只出现在审核结果里的值 `412`：提交要修改的章节或分卷在提交之后已被删除或换成了另一条记录，要新增的章节或分卷的序号已被占用，要删除的内容在提交之后被改过，或者写入会改到提交时没有改动的内容。这时通过没有写入任何内容，`result` 为 `{"error":"a record this change alters was removed or replaced after the change was submitted, or what it removes has changed since; submit it again from the current content"}`，提交者需要按当前内容重新提交。提交改动的字段在提交之后被别人改过不属于这种情况，通过时按提交写入。直接写入的请求不会收到 `412`。

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
- `DELETE /api/v4/account/athub/novels/{id}/illustrations/{illustrationId}` 不带查询参数或请求体。直接生效时返回 `204`，需要审核时返回 `202`。删除只解除插图与作品的关联，不删除图床文件。如果布局引用了该图，删除生效时会一并移除对应布局块，并将版本号加一。需要审核的删除，提交时该图不在布局里、通过时已被别人放进布局的，不会连带改动布局，这次提交不生效，审核记录的 `result_status` 为 `412`。

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
- 直接保存返回 `200` 和新版本的布局；需要审核返回 `202`。两者都在请求时校验版本，版本过期返回 `409`，应重新读取再保存。
- 需要审核的布局通过时不再校验版本：期间布局已被别人保存过的，仍按提交的布局整体写入，后通过的覆盖先通过的。提交的布局与提交时已保存的布局相同的，这次提交没有改动布局，通过时不写入布局。通过时布局引用的插图已被删除的不会写入，审核记录的 `result_status` 为 `400`。没有记下改动的旧提交通过时照旧校验版本，过期时 `result_status` 为 `409`。

上传、删除和布局保存沿用原有账户等级权限、审核和贡献历史，见[投稿、编辑与审核](/creatplat/workflow)。旧 `v5` 插图与布局路径返回 `404`，不再提供只提交图片 URL 的关联接口。

## 待合并的改动

`GET /api/v4/account/athub/novels/{id}/pending-changes` 返回所有待审核的提交对这部作品的改动，按提交逐项列出。作品详情页进入编辑模式时读取它，在对应位置提示已有待合并的改动并显示改动后的内容，见[投稿、编辑与审核](/creatplat/workflow)。

只接受网站登录会话，未登录返回 `401 login_required`。账户所属等级须允许修改作品资料、保存插图布局、上传插图、删除插图中的至少一项（「接口权限」里的「作品资料编辑」「修改 · 插图布局」「上传 / 新建 · 插图」「删除 · 插图」），也就是能进入编辑模式；四项都不允许，或账户被管理员禁用了 Key，返回 `403 operation_forbidden`。

| 查询键 | 说明 |
| --- | --- |
| `offset` | 可选，`0` 至 `1000000` 的整数，默认 `0`；不是该范围内的整数返回 `400 invalid_offset`。 |

只接受这一个查询参数，且最多出现一次；出现其他参数或 `offset` 重复返回 `400 invalid_query`。路径中的 `{id}` 是作品 ID，不是 `1` 至 `2147483647` 的整数返回 `400 invalid_novel_id`。

成功返回 `200`，响应带 `Cache-Control: no-store`：

```json
{
  "items": [
    {
      "id": "5f0c2a9e-8b1d-4c3a-9e7f-2d6b1a4c8e10",
      "created_at": "2026-11-18T09:30:00Z",
      "changes": [
        {
          "entity": "Novel",
          "action": "UPDATE",
          "id": 10,
          "fields": ["tagIds", "title"],
          "after": { "title": "新标题", "tagIds": [2, 3], "tagNames": ["奇幻", "冒险"] }
        }
      ]
    },
    {
      "id": "c1d7e4b2-0a6f-4e58-b3c9-7f2a5d8e1b34",
      "created_at": "2026-11-19T11:30:00Z",
      "changes": [
        { "entity": "Illustration", "action": "DELETE", "id": 41 },
        {
          "entity": "IllustrationLayout",
          "action": "UPDATE",
          "fields": ["blocks"],
          "after": { "blocks": [{ "imageId": 40, "x": 0, "y": 0, "width": 480, "height": 720 }] }
        }
      ]
    }
  ],
  "total": 2
}
```

| 响应键 | 说明 |
| --- | --- |
| `items` | 待审核的提交，按提交时间从早到晚排列，每次最多返回 50 项，其余用 `offset` 读取。 |
| `total` | 改动了这部作品的待审核提交总数。 |
| `items[].id` | 审核 ID（UUID），与提交列表、审核列表中的 `id` 相同。 |
| `items[].created_at` | 提交时间。 |
| `items[].changes` | 这项提交对这部作品的改动，每项是一条被新增、修改或删除的记录。 |

响应不包含提交者，也不包含提交的原始内容和改动前的值。`changes` 的每一项：

| 响应键 | 说明 |
| --- | --- |
| `entity` | 记录类型：`Novel` 作品资料、`Volume` 分卷、`Chapter` 章节、`Illustration` 插图、`IllustrationLayout` 插图布局。 |
| `action` | `INSERT` 新增、`UPDATE` 修改、`DELETE` 删除。 |
| `id` | `UPDATE`、`DELETE` 所针对记录的 ID；`INSERT` 和插图布局没有这个键。 |
| `fields` | 仅 `UPDATE`：被改动的字段名，按字典序排列。 |
| `after` | `UPDATE` 为这些字段改成的值，值可以是 `null`（例如清除封面时的 `coverUrl`）；`INSERT` 为新建的记录，不含它的 ID；`DELETE` 没有这个键。 |

- 作品资料的字段是 `title`、`authorId`、`platformId`、`status`、`tagIds`、`summary`、`coverUrl`。`authorId`、`platformId`、`tagIds` 被改动时，`after` 里附带对应的 `authorName`、`platformName`、`tagNames`，可直接用于显示；这三个名称不出现在 `fields` 里。
- 分卷的字段是 `title`；章节的字段是 `title`、`volumeId` 以及正文的 `contentHash`（MD5）和 `contentLength`（字符数），不返回正文。正文被改动时 `fields` 里是 `contentHash`，长度有变化时还有 `contentLength`。新增的分卷和章节另带 `novelId` 和序号 `order`；修改和删除的只给出记录 ID，不带序号。
- 新增的插图给出 `novelId`、`url`、`sha256`、`width`、`height`。插图布局的字段只有 `blocks`，值是改动后的完整布局；作品此前没有布局时这项改动是 `INSERT`，`after` 另带 `novelId`。
- 整部作品的删除表现为作品资料及其全部分卷、章节、插图和布局各一项 `DELETE`。
- 作者、标签的改名不属于某一部作品的改动，不在这里列出。
- `after` 是提交时预演得到的值，用于展示，不保证与通过后写入的逐项相同。这项提交自己新建的作者、标签或分卷在预演结束后并不存在，`after` 里指向它们的 `authorId`、`tagIds`、`volumeId` 是预演时分配的 ID，通过后实际的 ID 与它不同，显示作者和标签时应使用随附的名称。删除插图连带的布局改动，`after.blocks` 按提交时的布局算出，通过时移除的是届时布局里这张图的布局块。
- 提交时没有记下改动后的值的，`UPDATE`、`INSERT` 项没有 `after`，只给出 `entity`、`action` 以及 `UPDATE` 的 `id` 和 `fields`。

作品不存在，或没有改动它的待审核提交时，返回 `{"items":[],"total":0}`。

某项待审核提交记下的改动无法读取（格式版本不认识或已损坏）时，整个请求返回 `500 server_error`，不会只返回其余几项。创作者库或内容库没有接入时返回 `503 reviews_unavailable`；暂时无法核对权限或读取审核记录时返回 `503 permissions_unavailable`。

## 用个人 Key 上传

封面上传和插图上传除了网站登录会话，还接受 ATHub 个人 Key，供服务端程序或采集脚本直接上传图片文件。请求格式、图片限制和成功响应与上面两节相同，凭据改为 `Authorization: Bearer <api_key>`。示例中的 `API_BASE_URL` 是聚合入口的对外地址：

```bash
curl --request POST "$API_BASE_URL/api/v4/account/athub/cover" \
  --header "Authorization: Bearer $ATHUB_API_TOKEN" \
  --form 'file=@cover.jpg'
```

```bash
curl --request POST "$API_BASE_URL/api/v4/account/athub/novels/10/illustrations" \
  --header "Authorization: Bearer $ATHUB_API_TOKEN" \
  --form 'file=@illustration.jpg'
```

示例中的作品 ID `10` 是占位值，调用时换成真实的作品 ID。

- 请求带有 `Authorization` 请求头就按 Key 调用处理：不读取 Cookie，也不需要 `X-AlbaTextus-Client`。Key 无效时不会改用同一请求里的登录会话。
- Key 格式不对、不存在、已停用或已被重置，以及账户被封禁或被管理员禁用 Key 时，返回 `401 invalid_api_key`；账户等级不允许该操作返回 `403 operation_forbidden`；Key 累计调用次数达到上限返回 `429 api_key_total_call_limit_reached`。账户库无法核对 Key 或无法开始记录时返回 `503`。
- 先核对 Key、额度和权限，再读取图片：被拒绝的调用不会在图床留下文件。
- 调用写入 ATHub 调用记录并计入 Key 的累计次数。界面按 `/api/v4` 路径展示。Key 通过核对后才发现的问题（如作品 ID 无效、图片不合格、图床保存失败）同样计一次调用。
- 封面按「上传 / 新建 · 封面」判断，不进入审核。插图沿用「上传 / 新建 · 插图」的权限、审核和贡献历史。

`/api/v4` 由创作者平台提供，可以直接访问聚合端口 `8010`，也可经账户前端的 `/api/v4/*` 转发到达。若 API 域名按路径放行，需允许 `/api/v4`，见[生产部署](/deploy/production)。接口面向服务端程序：请求带有不在允许列表中的 `Origin` 时返回 `403 invalid_origin`。
