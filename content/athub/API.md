# ATHub API 文档

版本日期：2026-11-10。本文覆盖 Go 服务全部公开内容 API，包括获取、上传、覆盖和删除。

## 1. 地址、鉴权与通用约定

- 请求发送到统一 **Go 程序**中的 ATHub 内容模块；账户功能使用 `8001` 端口的 `/api/v1/*`，内容功能使用 `8003` 端口的 `/api/v2/*`。
- 对外服务地址：`https://api.albatextus.com`。本文全部调用示例使用此 HTTPS 地址。
- 自托管时，内容接口默认监听 `http://127.0.0.1:8003`，由服务端 `ATHUB_HTTP_ADDR` 决定。
- API 域名由外部反向代理直接转发到 ATHub 后端 `8003`。账户前端不提供或转发 `/api/v2/*`；OAuth 与账户 `/api/v1/*` 仍可通过前端同源入口访问。
- 所有内容路径统一带 `/api/v2/` 前缀，不接受末尾 `/`，例如使用 `/api/v2/upload`，没有 `/athub` 中间路径。旧 `/api/upload`、`/upload` 和末尾带 `/` 的路径不再兼容。
- 生产环境使用 HTTPS。接口面向服务端或采集程序，不提供浏览器跨域 CORS 支持。

### 请求头

| 键 | 必填 | 值 |
| --- | --- | --- |
| `Authorization` | 所有请求必填 | `Bearer <API_KEY>`，唯一有效凭据为登录用户在账户接口创建的 ATHub 个人 API Key。 |
| `Content-Type` | 有 JSON 请求体的 POST/PUT 必填 | `application/json`，也接受 `application/json; charset=utf-8`。 |
| `Accept` | 可选 | 推荐 `application/json`。 |

个人 Key 用于标识调用用户，目前拥有共享内容库的读写权限，不按用户隔离小说。
不要放进网页、客户端公开包或日志。原全局服务密钥、旧版个人密钥、OAuth access token、
Cookie 和用户身份请求头均不能替代新 Key。Key 默认永久有效，停用、重置为旧 Key 或用户停用后，调用返回 `401`。

账户功能在 `8001` 提供以下接口，要求账户登录会话；写操作还需
`X-AlbaTextus-Client: account-center`，不接受跨站请求。通过前端同源入口访问时可使用相同路径。

| 方法 | 账户接口 | 作用 |
| --- | --- | --- |
| POST | `/api/v1/account/key` | 提交 `{}` 自动取得唯一 Key；可选 `name`，不接受 `expires_at`。首次生成返回一次性明文，重复请求只返回已有 Key 的元数据。 |
| GET | `/api/v1/account/key` | `keys` 数组只包含当前 Key 的前缀、停用状态、最后调用时间和调用次数，不返回明文或哈希。 |
| POST | `/api/v1/account/key/reset` | 提交 `{}`，停用旧 Key 并生成新的永久 Key，返回一次性明文，保留历史调用记录。 |
| DELETE | `/api/v1/account/key/{id}` | 停用自己的 Key，保留历史调用记录。 |
| GET | `/api/v1/account/athub/usage` | 自己的总次数、成功/失败/待完成次数，按方法、接口、端口和状态码分组统计；可选 `days=1`、`7` 或 `30` 获取指定范围及按端口聚合的趋势。 |
| GET | `/api/v1/account/athub/calls?limit=50&offset=0` | 自己的调用明细，`limit` 为 1–100，`offset` 为 0–1000000。 |

首次生成或重置返回 `201`，结构为 `{"key":{...},"api_key":"ath_..."}`；明文只返回一次。
已有 Key 时，重复自动申请返回 `200 {"key":{...}}`，不会再次返回明文。
每个用户只有一个当前 Key，默认永久有效。停用后刷新页面不会恢复启用；通过主动重置生成新 Key。
前端 `/account/key` 在首次访问时自动申请 Key，支持复制一次性明文、重置和停用。
重置后的旧 Key 保留为历史记录，不再接受内容调用，已有统计继续保留。
管理员可在用户详情中禁用 Key，限制属于账户级别，用户无法通过重置或自动申请绕过。
被限制时，用户重置接口返回 `403 athub_admin_disabled`，内容调用返回 `401 invalid_api_key`。
封禁账户会同步禁用 Key；解封账户不会自动恢复 Key，需管理员解除 Key 限制后由用户重置。
已在执行中的请求可以完成，后续调用会校验最新状态。

管理员使用 `GET /api/v1/admin/users/{id}/athub-key` 查看状态，使用
`PUT /api/v1/admin/users/{id}/athub-key` 提交 `{"disabled":true,"updated_at":"..."}` 禁用，
`disabled:false` 解除限制。接口遵守现有管理员角色层级、登录会话与来源检查，禁止普通用户调用。
管理员只能读取元数据，不能获取用户 Key 的明文或哈希。

鉴权表和调用表放在账户数据库；内容数据库保存平台、作者、标签库和小说内容。
内容请求先写入待完成记录，再执行业务并补全状态码、耗时、响应字节数。
记录包括正常请求和可归属用户的失败请求；未知 Key 的失败请求以匿名记录保存。
健康检查和账户管理请求不计入内容调用次数。不记录密钥、请求头、查询字符串或小说正文；
未知接口以 `/api/v2/{unknown}` 归类，防止记录敏感路径和无限扩张的统计项。
账户数据库不可用、无法校验 Key 或无法开始调用记录时，内容接口返回 `503`，不执行业务。
程序中断或记录完成失败时保留 `status=null` 的待完成记录，不把它计作成功。

除鉴权外，没有额外签名字段。GET/DELETE 参数放在 URL 查询字符串；POST/PUT 数据放在 JSON 请求体。

### 编码、类型和限制

| 项目 | 规则 |
| --- | --- |
| 请求体 | 一个 UTF-8 JSON 对象，无 BOM。拒绝顶层数组、`null`、多段 JSON 和未知字段。 |
| 文件上传 | 将 `.json` 文件内容作为整个 HTTP 请求体发送，不使用 `multipart/form-data`。 |
| 大小上限 | 每个请求体最多 **8 MiB = 8,388,608 字节**，包含 JSON 结构、转义字符等。 |
| 单批上传 | `/api/v2/upload` 最多 200 个卷、1000 个章节，还须满足 8 MiB 限制。超过时分批发送。 |
| ID、排序 | JSON number，必须是 `1` 至 `2147483647` 的整数；不能用数字字符串或小数。可空 ID 另见字段表。 |
| 时间 | 服务端生成，响应为 RFC 3339 时间字符串；示例使用 UTC。请求不能提交 `id`、`createdAt`、`updatedAt`。 |
| 文本 | `title` 和平台 `name` 去除首尾空白后不能为空；所有存储文本都禁止 NUL 字符 `\u0000`。 |
| 正文 | 纯文本，保留换行、首尾空白和缩进，但不能全部为空白。无 HTML 渲染、TXT/EPUB 解析或编码转换。 |
| 图片 | `coverUrl` 只存字符串，不接收图片二进制，也不会抓取远程封面。 |
| 查询参数 | 拒绝未知键和同名参数重复出现，例如 `id=1&id=2`。 |
| 请求时限 | 每次 API 处理的数据库上下文期限为 15 秒；上传是同步操作，不返回后台任务 ID。 |

成功响应没有统一的 `data` 外壳：单条返回对象，列表直接返回数组。
所有响应带 `Cache-Control: no-store`；有 JSON 的响应使用 `application/json; charset=utf-8`。
`204` 响应没有响应体，也没有响应 JSON。

### 通用分页参数

分页列表接口采用下列字段，响应不含 `total`、`nextCursor` 或页码；`/api/v2/toc` 为全量目录对象，不使用分页：

| 查询键 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `limit` | integer | 否 | `20` | `1` 至 `100`，每次最多返回的条数。 |
| `offset` | integer | 否 | `0` | `0` 至 `2147483647`，跳过的条数。 |

空列表返回 `[]`。按 `offset += limit` 继续读取；返回不足 `limit` 条即到达末页。
分页没有跨请求快照保证，上传和读取同时进行时可能看到数据变化。

## 2. 接口总览

| 方法 | 路径 | 用途 | 成功状态 |
| --- | --- | --- | --- |
| GET | `/api/v2/platforms` | 获取平台列表或单个平台 | 200 |
| POST | `/api/v2/platforms` | 新建平台 | 201 |
| GET | `/api/v2/authors` | 获取作者列表或单个作者 | 200 |
| POST | `/api/v2/authors` | 新建作者标识 | 201 |
| GET | `/api/v2/tags` | 获取独立标签库列表或单个标签 | 200 |
| POST | `/api/v2/tags` | 新建标签 | 201 |
| PUT | `/api/v2/tags?id=...` | 修改标签名称 | 200 |
| DELETE | `/api/v2/tags?id=...` | 删除未被引用的标签 | 204 |
| GET | `/api/v2/novelinfo` | 获取小说列表或小说元信息 | 200 |
| POST | `/api/v2/novelinfo` | 新建小说，仅元信息 | 201 |
| PUT | `/api/v2/novelinfo?id=...` | 完整覆盖小说元信息 | 200 |
| DELETE | `/api/v2/novelinfo?id=...` | 删除小说及全部卷、章节 | 204 |
| GET | `/api/v2/volumes` | 获取卷列表或一个卷 | 200 |
| PUT | `/api/v2/volumes` | 上传一个卷，不存在则新增、存在则覆盖卷名 | 200 |
| DELETE | `/api/v2/volumes?novelId=...&order=...` | 删除空卷 | 204 |
| GET | `/api/v2/toc?novelId=...` | 一次获取全书卷与章节目录，不含正文 | 200 |
| GET | `/api/v2/content` | 获取章节列表或一个章节，包含正文 | 200 |
| PUT | `/api/v2/content` | 上传一个章节，不存在则新增、存在则覆盖 | 200 |
| DELETE | `/api/v2/content?novelId=...&order=...` | 删除一个章节 | 204 |
| POST | `/api/v2/upload` | 一次创建小说并导入卷/章节，或给已有小说批量续传 | 201 / 200 |

POST 不带查询参数；`PUT /api/v2/volumes`、`PUT /api/v2/content` 也不带查询参数。
不支持 PATCH。平台和作者目前只提供获取与创建，没有修改/删除接口。

## 3. 平台

### 3.1 获取：GET /api/v2/platforms

获取单个：`GET /api/v2/platforms?id=1`。

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 单条模式必填 | 平台 ID；不能与任何其他参数组合。不存在返回 404。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

列表示例：`GET /api/v2/platforms?limit=20&offset=0`，按 ID 升序。

### 3.2 创建：POST /api/v2/platforms

请求：

```json
{
  "name": "示例平台",
  "url": "https://example.com"
}
```

| 请求键 | 类型 | 必填 | 默认/约束 |
| --- | --- | --- | --- |
| `name` | string | 是 | 去除首尾空白后不能为空。 |
| `url` | string / null | 否 | 省略或 null 保存为 null；作为文本保存，不做网络请求或 URL 有效性核验。 |

`201` 响应，同时返回 `Location: /api/v2/platforms?id=1`：

```json
{
  "id": 1,
  "name": "示例平台",
  "url": "https://example.com"
}
```

响应的 `id` 是生成的平台 ID，其他键与请求字段相同，`url` 总会出现，可能为 null。
GET 单条返回相同结构，GET 列表返回这些对象组成的数组。
平台名称不唯一，重复 POST 会创建新平台，不会按名称自动合并。

## 4. 作者

### 4.1 获取：GET /api/v2/authors

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 单条模式必填 | 作者 ID，不得与其他参数组合；不存在返回 404。 |
| `platformId` | integer | 否 | 仅列表模式，筛选所属平台；平台不存在或没有作者时返回空数组。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

示例：`GET /api/v2/authors?id=2` 或 `GET /api/v2/authors?platformId=1&limit=20&offset=0`。
列表按 ID 升序。

### 4.2 创建：POST /api/v2/authors

```json
{
  "platformId": 1
}
```

唯一请求键 `platformId` 为必填 integer，必须引用已存在的平台，否则返回 400。
当前作者表没有姓名、来源作者 ID 等字段；不要提交 `name`、`authorName` 等额外键。

`201` 响应，同时返回 `Location: /api/v2/authors?id=2`：

```json
{
  "id": 2,
  "platformId": 1
}
```

响应的 `id` 是生成的作者标识，`platformId` 为所属平台。
GET 单条结构相同，GET 列表为此类对象的数组。重复 POST 会创建新的作者标识。

## 5. 小说元信息

### 5.1 获取：GET /api/v2/novelinfo

获取单本：`GET /api/v2/novelinfo?id=10`。
获取列表：`GET /api/v2/novelinfo?platformId=1&authorId=2&limit=20&offset=0`。

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 单条模式必填 | 小说 ID，不能和其他参数组合；不存在返回 404。 |
| `platformId` | integer | 否 | 仅列表模式，平台筛选。 |
| `authorId` | integer | 否 | 仅列表模式，作者筛选；与平台筛选同时提供时取交集。 |
| `tagId` | integer | 否 | 仅列表模式，筛选引用此标签的小说；与其他筛选取交集。标签不存在时返回 `[]`。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

列表按小说 ID 降序；筛选无结果时返回 `[]`。
元信息不嵌套卷或章节，分别使用 `/api/v2/volumes` 和 `/api/v2/content` 获取。

### 5.2 创建：POST /api/v2/novelinfo

```json
{
  "platformId": 1,
  "authorId": 2,
  "title": "示例小说",
  "summary": "小说简介",
  "coverUrl": "https://example.com/cover.jpg",
  "status": "ONGOING",
  "tagIds": [3, 5]
}
```

### 5.3 覆盖：PUT /api/v2/novelinfo?id=10

URL 只允许必填查询键 `id`。请求体与 POST 完全相同。
这是**完整替换而非局部更新**，省略可空字段会清空，省略状态会恢复为 `ONGOING`。
省略 `tagIds`、传 `null` 或 `[]` 都会清空这部小说的全部标签引用，不会删除标签库中的标签。
不存在返回 404。

### 5.4 小说写入字段：POST、PUT 及 /api/v2/upload.novel 共用

| 请求键 | 类型 | 必填 | 默认/约束 |
| --- | --- | --- | --- |
| `platformId` | integer | 是 | 已存在的平台 ID。 |
| `authorId` | integer / null | 否 | 省略/null 保存为 null；非空时作者必须存在且属于 `platformId`。 |
| `title` | string | 是 | 去除首尾空白后不能为空。书名不唯一，不按书名自动去重。 |
| `summary` | string / null | 否 | 省略/null 保存为 null；空字符串与 null 不同。 |
| `coverUrl` | string / null | 否 | 省略/null 保存为 null；不验证或下载图片。 |
| `status` | string | 否 | `ONGOING` 连载中或 `COMPLETED` 已完结，区分大小写。省略/null/空字符串按 `ONGOING`。 |
| `tagIds` | integer[] / null | 否 | 标签库中已存在的标签 ID，不得重复。省略/null 按 `[]`；任一标签不存在返回 400，整次写入回滚。 |

POST 成功返回 `201` 和 `Location: /api/v2/novelinfo?id=10`；PUT 成功返回 `200`。
两者以及 GET 单条的响应结构：

```json
{
  "id": 10,
  "platformId": 1,
  "authorId": 2,
  "title": "示例小说",
  "summary": "小说简介",
  "coverUrl": "https://example.com/cover.jpg",
  "status": "ONGOING",
  "tagIds": [3, 5],
  "createdAt": "2026-10-29T04:00:00Z",
  "updatedAt": "2026-10-29T04:00:00Z"
}
```

`id`、`createdAt`、`updatedAt` 为只读生成字段；其余键定义与写入字段表相同。
可空字段即使为 null 也会返回。GET 列表为上述对象组成的数组。
`tagIds` 始终返回数组，按标签 ID 升序；无标签时为 `[]`。标签名称单独通过标签库查询，不在小说中重复存储。
批量创建的 `novel.tagIds` 使用相同规则；以 `novelId` 续传保留已有标签引用。

### 5.5 删除：DELETE /api/v2/novelinfo?id=10

只接受必填 `id` 查询键，无请求体。成功返回 `204`；不存在返回 404。
**永久删除这部小说及全部卷、章节**，不会删除平台或作者。
小说的标签引用一并删除，标签库中的标签保留，可继续被其他小说引用。

## 6. 卷

### 6.1 获取：GET /api/v2/volumes

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `novelId` | integer | 是 | 所属小说 ID。 |
| `order` | integer | 单条模式必填 | 小说内的卷序号，不是卷 ID；不得与分页参数组合。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

示例：`GET /api/v2/volumes?novelId=10&order=1`，或 `GET /api/v2/volumes?novelId=10&limit=20&offset=0`。
列表按 `order` 升序。小说存在但无卷/该页为空时返回 `[]`，小说不存在返回 404。
单条模式下卷不存在也返回 404。卷响应不包含章节正文或章节计数。

### 6.2 上传一个卷：PUT /api/v2/volumes

不带查询参数：

```json
{
  "novelId": 10,
  "order": 1,
  "title": "第一卷 启程"
}
```

| 请求键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `novelId` | integer | 是 | 已存在的小说 ID。 |
| `order` | integer | 是 | 从 1 开始的小说内卷序号，与 `novelId` 共同定位卷。 |
| `title` | string | 是 | 去除首尾空白后不能为空。 |

以 `(novelId, order)` 新增或覆盖。不存在则创建，存在则只覆盖卷标题，保留卷 ID、创建时间和已有章节关联。
无论新增还是覆盖均返回 `200`；小说引用不存在返回 400。

PUT 和 GET 单条响应：

```json
{
  "id": 20,
  "novelId": 10,
  "order": 1,
  "title": "第一卷 启程",
  "createdAt": "2026-10-29T04:00:00Z",
  "updatedAt": "2026-10-29T04:00:00Z"
}
```

`id` 为数据库卷 ID，单章上传的 `volumeId` 使用此值；不是 `order`。
`createdAt`、`updatedAt` 为服务端时间，其他响应键与请求字段相同。
GET 列表为上述对象的数组。

### 6.3 删除：DELETE /api/v2/volumes?novelId=10&order=1

只允许两个必填查询键 `novelId`、`order`，无请求体。
成功返回 `204`，不存在返回 404。
卷仍被章节引用时返回 `409`，不删除任何章节。先用 `/api/v2/content` 或 `/api/v2/upload` 将章节移出该卷，或先删除章节。

## 7. 章节正文

### 7.1 获取：GET /api/v2/content

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `novelId` | integer | 是 | 小说 ID。 |
| `order` | integer | 单条模式必填 | **全书章节序号**，不得与分页参数组合。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

示例：`GET /api/v2/content?novelId=10&order=1`，或 `GET /api/v2/content?novelId=10&limit=20&offset=0`。
列表按章节 `order` 升序，包含完整正文。小说存在但无章节/该页为空返回 `[]`；小说不存在返回 404。
单条模式下章节不存在也返回 404。
没有按卷筛选参数；客户端依据返回的 `volumeId` 分组。读取整本小说需逐页请求，不提供无上限全量正文路由。
只需标题与分卷关系时，使用第 7.4 节的 `/api/v2/toc`，避免传输正文。

### 7.2 上传一个章节：PUT /api/v2/content

不带查询参数：

```json
{
  "novelId": 10,
  "volumeId": 20,
  "order": 1,
  "title": "第一章 出发",
  "content": "第一段。\n\n第二段。"
}
```

| 请求键 | 类型 | 必填 | 默认/约束 |
| --- | --- | --- | --- |
| `novelId` | integer | 是 | 已存在的小说 ID。 |
| `volumeId` | integer / null | 否 | 数据库卷 ID，必须属于这部小说；省略/null 表示未分卷，覆盖时也会清除旧关联。 |
| `order` | integer | 是 | 从 1 开始的**全书章节序号**，跨卷不重置，可以不连续。 |
| `title` | string | 是 | 去除首尾空白后不能为空。 |
| `content` | string | 是 | 纯文本，保留原始换行和空白，不允许全为空白。 |

以 `(novelId, order)` 新增或覆盖，覆盖时保留章节 ID，替换标题、正文和卷关联。
无论新增还是覆盖均返回 `200`。小说/卷不存在或卷属于其他小说返回 400。
`POST /api/v2/content` 不支持，单章上传使用 PUT；批量上传使用 `POST /api/v2/upload`。

PUT 和 GET 单条响应：

```json
{
  "id": 30,
  "novelId": 10,
  "volumeId": 20,
  "order": 1,
  "title": "第一章 出发",
  "content": "第一段。\n\n第二段。",
  "updatedAt": "2026-10-29T04:00:00Z"
}
```

`id` 是章节 ID，`updatedAt` 为服务端更新时间，其他键定义与请求字段相同。
未分卷时 `volumeId` 为 null。GET 列表为这些对象组成的数组。

### 7.3 删除：DELETE /api/v2/content?novelId=10&order=1

只允许两个必填查询键 `novelId`、`order`，无请求体。
成功返回 `204`，小说或章节不存在返回 404。不重新编号其他章节，也不删除空卷。

### 7.4 获取全书目录：GET /api/v2/toc?novelId=10

只读接口，要求相同的 Bearer Token，无请求体。只接受一个必填查询键：

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `novelId` | integer | 是 | 已存在的小说 ID，正的 32 位整数。 |

不接受 `limit`、`offset`、`order`、`volumeId` 或其他查询键，重复参数也返回 400。
不支持写入，其他请求方法返回 `405` 和 `Allow: GET`。

成功返回 `200`，一次返回完整目录，**不分页、不查询或返回章节正文**：

```json
{
  "novelId": 10,
  "volumes": [
    {
      "id": 20,
      "novelId": 10,
      "order": 1,
      "title": "第一卷 启程",
      "createdAt": "2026-10-29T04:00:00Z",
      "updatedAt": "2026-10-29T04:00:00Z"
    }
  ],
  "chapters": [
    {
      "id": 30,
      "novelId": 10,
      "volumeId": null,
      "order": 1,
      "title": "序章",
      "updatedAt": "2026-10-29T04:00:00Z"
    },
    {
      "id": 31,
      "novelId": 10,
      "volumeId": 20,
      "order": 2,
      "title": "第一章 出发",
      "updatedAt": "2026-10-29T04:00:00Z"
    }
  ]
}
```

- `novelId`：当前小说 ID。
- `volumes`：完整卷列表，结构与第 6 节相同，按卷 `order` 升序，包括没有章节的空卷。
- `chapters`：完整章节摘要列表，按**全书章节 `order`** 升序，不因分卷重置序号。
- 章节摘要只包含 `id`、`novelId`、`volumeId`、`order`、`title`、`updatedAt`；字段含义与第 7.2 节相同，没有 `content` 键。
- 客户端通过 `chapters[].volumeId` 与 `volumes[].id` 关联；null 为未分卷章节，不能因分组丢弃。
- 卷与章节来自同一条 SQL 查询的快照，避免并发上传期间返回不一致的分卷关系。

小说存在但没有卷或章节时，对应数组为 `[]`，不会返回 null；完全空书返回
`{"novelId":10,"volumes":[],"chapters":[]}`。小说不存在返回 `404`。
实际阅读时再用 `GET /api/v2/content?novelId=10&order=2` 按需读取章节正文。

## 8. 批量上传：POST /api/v2/upload

这是推荐的小说导入接口。上传前先取得平台 ID，可选取得作者 ID。
每次请求只能选择以下一种模式：

1. **新建小说**：提供 `novel` 对象，不提供 `novelId`。成功返回 `201`。
2. **已有小说续传**：提供 `novelId`，不提供 `novel`。成功返回 `200`。

不带查询参数。新建模式允许只建元信息；续传模式至少包含一个卷或一个章节。

### 8.1 新建小说并上传卷、章节

```json
{
  "novel": {
    "platformId": 1,
    "authorId": 2,
    "title": "示例小说",
    "summary": "小说简介",
    "coverUrl": null,
    "status": "ONGOING"
  },
  "volumes": [
    { "order": 1, "title": "第一卷 启程" },
    { "order": 2, "title": "第二卷 远方" }
  ],
  "chapters": [
    {
      "order": 1,
      "volumeOrder": null,
      "title": "序章",
      "content": "未分卷的序章正文。"
    },
    {
      "order": 2,
      "volumeOrder": 1,
      "title": "第一章 出发",
      "content": "第一段。\n\n第二段。"
    },
    {
      "order": 3,
      "volumeOrder": 2,
      "title": "第二章 远行",
      "content": "第二卷中的章节正文。"
    }
  ]
}
```

### 8.2 给已有小说分批续传

```json
{
  "novelId": 10,
  "volumes": [
    { "order": 3, "title": "第三卷 归途" }
  ],
  "chapters": [
    {
      "order": 4,
      "volumeOrder": 3,
      "title": "第三章 归来",
      "content": "新章节正文。"
    },
    {
      "order": 5,
      "volumeOrder": 1,
      "title": "第一卷补记",
      "content": "引用此前已经存在的第一卷。"
    }
  ]
}
```

续传只修改本批次列出的卷、章节，不清空其他数据，不修改小说元信息。
要修改小说元信息，另行使用 `PUT /api/v2/novelinfo?id=10`。

### 8.3 顶层字段

| 请求键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `novel` | object / null | 新建模式必填 | 第 5.4 节定义的小说写入对象；与非空 `novelId` 互斥。 |
| `novelId` | integer / null | 续传模式必填 | 已存在的小说 ID；不存在返回 404。与非空 `novel` 互斥。 |
| `volumes` | array / null | 否 | 本批次要新增/覆盖的卷，最多 200 项；省略/null/空数组均表示本批不写入卷。 |
| `chapters` | array / null | 否 | 本批次要新增/覆盖的章节，最多 1000 项；省略/null/空数组均表示本批不写入章节。 |

### 8.4 volumes 数组每项的所有键

| 请求键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `order` | integer | 是 | 小说内卷序号；同一批次不能重复，不要求数组按序排列。 |
| `title` | string | 是 | 卷名，去除首尾空白后不能为空。 |

这里不提交 `novelId`、`id` 或时间字段；小说由顶层确定。
卷按 `(novelId, order)` 新增或覆盖，已有卷保留 ID、创建时间和章节关联。

### 8.5 chapters 数组每项的所有键

| 请求键 | 类型 | 必填 | 默认/约束 |
| --- | --- | --- | --- |
| `order` | integer | 是 | 全书章节序号；同一批次不能重复，跨卷不重置，不要求连续或数组排序。 |
| `volumeOrder` | integer / null | 否 | **卷序号，不是卷 ID**；引用本批次创建的卷，或同一本小说此前已经存在的卷。省略/null 会将章节设为未分卷。 |
| `title` | string | 是 | 章节标题，去除首尾空白后不能为空。 |
| `content` | string | 是 | 非全空白的纯文本正文，原始换行和空白保留。 |

批量上传不接受单章接口的 `volumeId`，用 `volumeOrder` 避免新卷尚无数据库 ID 的问题。
卷先写入，章节后写入；数组顺序不影响关联。卷引用找不到返回 400，整个事务回滚。
同一小说允许未分卷章节与分卷章节混用，卷可以暂时没有章节。

### 8.6 成功响应的所有键

新建返回 `201`，同时带 `Location: /api/v2/novelinfo?id=10`；续传返回 `200`。

```json
{
  "novel": {
    "id": 10,
    "platformId": 1,
    "authorId": 2,
    "title": "示例小说",
    "summary": "小说简介",
    "coverUrl": null,
    "status": "ONGOING",
    "createdAt": "2026-10-29T04:00:00Z",
    "updatedAt": "2026-10-29T04:00:00Z"
  },
  "volumes": [
    {
      "id": 20,
      "novelId": 10,
      "order": 1,
      "title": "第一卷 启程",
      "createdAt": "2026-10-29T04:00:00Z",
      "updatedAt": "2026-10-29T04:00:00Z"
    }
  ],
  "chapters": [
    {
      "id": 30,
      "order": 2,
      "volumeId": 20,
      "updatedAt": "2026-10-29T04:00:00Z"
    }
  ],
  "chapterCount": 1
}
```

以上用一卷一章展示响应结构，并非 8.1 完整请求的逐项响应。

| 响应键 | 类型 | 说明 |
| --- | --- | --- |
| `novel` | object | 完整小说元信息，所有键见第 5 节。 |
| `volumes` | array | **本批次显式写入**的卷，结构见第 6 节，按请求数组顺序返回；未写卷时为 `[]`。仅被章节引用的旧卷不会额外出现在这里。 |
| `chapters` | array | 本批次章节回执，按请求数组顺序返回；未写章节时为 `[]`。不重复返回正文，完整章节用 GET /api/v2/content 获取。 |
| `chapters[].id` | integer | 章节数据库 ID。 |
| `chapters[].order` | integer | 全书章节序号。 |
| `chapters[].volumeId` | integer / null | 解析后的数据库卷 ID，未分卷为 null。 |
| `chapters[].updatedAt` | string | 本次写入的服务端更新时间。 |
| `chapterCount` | integer | 本批次成功写入的章节条数，**不是全书章节总数**。新增和覆盖都计数。 |

### 8.7 事务、覆盖与重试规则

- 每批次一个数据库事务，任何关联或数据库错误都会撤销本批新小说、卷和章节的全部修改，不会部分成功。
- 卷按 `(novelId, order)`、章节按 `(novelId, order)` 覆盖。既有章节保留 ID，替换标题、正文与卷关联。
- 卷序号和章节序号是两套独立编号。序号是定位键，提交新序号不会移动/重编号旧记录，而是创建另一条。
- 同一批内部的重复卷序号或重复章节序号直接返回 400，避免隐式“最后一条覆盖”。
- **首次创建不按标题去重，也没有幂等键。重复发送带 `novel` 的请求会创建多部小说。**
- 成功取得 `novel.id` 后，后续请求统一改用 `novelId`。相同续传数据可以重试，记录 ID 保持不变，更新时间会更新。
- 如首次请求超时或连接中断，提交结果可能不明；先查询并核对，不要盲目再次用 `novel` 新建。
- 上传卷/章节不刷新小说的 `updatedAt`，该字段仅反映小说元信息写入时间。
- 多批之间不是同一个事务：某批失败不会撤销此前成功的批次。8 MiB/1000 章以内按需拆分，分批进度由客户端记录。

## 9. 错误响应与状态码

所有错误的 JSON 结构只有一个键：

```json
{
  "error": "provide exactly one of novel or novelId"
}
```

`error` 为便于诊断的英文说明，不是稳定的机器错误枚举。客户端应先按 HTTP 状态码判断。
批量参数错误可能附带 `volumes[0]`、`chapters[1]` 等零基下标。

| HTTP 状态 | 场景 |
| --- | --- |
| 200 | 获取、覆盖/新增单卷单章、已有小说批量续传成功。 |
| 201 | 创建平台、作者、标签、小说，或批量上传中新建小说成功。 |
| 204 | 删除成功，无响应体。 |
| 400 | 缺字段、未知字段/查询键、类型/范围错误、空标题/正文、NUL、JSON 错误、单批重复序号/数量超限、非法关联、批量模式冲突。 |
| 401 | 缺少/错误/重复的 Authorization。返回 `WWW-Authenticate: Bearer`。鉴权先于路由检查。 |
| 404 | 路径不存在，或获取/删除/更新的目标不存在；续传小说不存在。 |
| 405 | 路径不支持该请求方法，返回 `Allow` 头。 |
| 409 | 数据唯一性冲突（含标签重名），或试图删除仍包含章节的卷、仍被小说引用的标签。 |
| 413 | JSON 请求体超过 8 MiB。 |
| 415 | JSON 写入请求没有正确的 `Content-Type`，包括 multipart 上传。 |
| 500 | 未预期服务或数据库错误，不返回数据库内部细节。 |
| 504 | 数据库请求上下文超时。 |

引用错误与目标不存在的区别：`PUT /api/v2/content` 引用不存在的小说/卷是 400；
`GET /api/v2/content` 获取不存在的小说/章节是 404；`POST /api/v2/upload` 用不存在的 `novelId` 续传是 404。

## 10. 完整调用示例

以下示例要求 Go 服务已运行，并将创建时返回的个人 Key 保存到调用端 `ATHUB_API_TOKEN` 环境变量中。它不是 Go 服务的全局配置。
不要将真实密钥写进文档或提交到 Git。

### 10.1 PowerShell：从零创建平台并上传

```powershell
$base = 'https://api.albatextus.com' # 自托管时改为实际 Go 服务地址
$headers = @{ Authorization = "Bearer $env:ATHUB_API_TOKEN" }

$platformJson = @{ name = 'My platform'; url = $null } | ConvertTo-Json
$platform = Invoke-RestMethod "$base/api/v2/platforms" -Method Post -Headers $headers `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($platformJson))

$upload = @{
  novel = @{
    platformId = $platform.id
    title = 'Example novel'
    authorId = $null
    summary = 'Introduction'
    coverUrl = $null
    status = 'ONGOING'
  }
  volumes = @(@{ order = 1; title = 'Volume 1' })
  chapters = @(
    @{ order = 1; volumeOrder = 1; title = 'Chapter 1'; content = "Paragraph 1.`nParagraph 2." }
  )
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod "$base/api/v2/upload" -Method Post -Headers $headers `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($upload))

$novelId = $result.novel.id
Invoke-RestMethod "$base/api/v2/novelinfo?id=$novelId" -Headers $headers
Invoke-RestMethod "$base/api/v2/volumes?novelId=$novelId" -Headers $headers
Invoke-RestMethod "$base/api/v2/toc?novelId=$novelId" -Headers $headers
Invoke-RestMethod "$base/api/v2/content?novelId=$novelId&order=1" -Headers $headers
```

### 10.2 上传 JSON 文件

把第 8.1 节 JSON 保存为 UTF-8 无 BOM 文件，替换真实平台/作者 ID。
下面假设文件在 `temp/api/v2/upload.json`。这只是请求格式示例，不会自动读取本机文件路径。

```powershell
curl.exe --request POST 'https://api.albatextus.com/api/v2/upload' `
  --header "Authorization: Bearer $env:ATHUB_API_TOKEN" `
  --header 'Content-Type: application/json; charset=utf-8' `
  --data-binary '@temp/api/v2/upload.json'
```

不要使用 `-F file=@...`。接口接收 JSON 内容，不接受 `file`、`filePath`、`filename`、`encoding` 等额外字段。

### 10.3 续传下一批

```powershell
$nextBatch = @{
  novelId = $novelId
  chapters = @(
    @{ order = 2; volumeOrder = 1; title = 'Chapter 2'; content = 'Next chapter body.' }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod "$base/api/v2/upload" -Method Post -Headers $headers `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($nextBatch))
```

重发这个续传请求会覆盖同一本书的第 2 章，不会创建第二本小说或重复章节。

### 10.4 分页获取全部章节

```powershell
$limit = 100
$offset = 0
do {
  $page = Invoke-RestMethod "$base/api/v2/content?novelId=$novelId&limit=$limit&offset=$offset" -Headers $headers
  foreach ($chapter in $page) {
    # 在这里消费 chapter.id / volumeId / order / title / content / updatedAt
    $chapter
  }
  $offset += $limit
} while ($page.Count -eq $limit)
```

上传完成后再开始全量分页读取，可以避免边上传边分页产生的数据变化。

## 11. 标签库

标签保存在独立的 `Tag` 表，通过 `NovelTag` 与小说建立多对多引用；同一个标签可用于不同平台的多部小说。
先创建或查询标签取得 ID，再在小说元信息中提交 `tagIds`。

### 11.1 获取：GET /api/v2/tags

单条查询：`GET /api/v2/tags?id=3`，只允许 `id` 参数；不存在返回 404。
列表查询：`GET /api/v2/tags?limit=20&offset=0`，只接受通用分页参数，按 ID 升序。
列表为空时返回 `[]`；单条返回下节的对象，列表返回这些对象组成的数组。
所有标签接口沿用个人 API Key 鉴权、JSON 错误格式和请求体限制。

### 11.2 创建：POST /api/v2/tags

不接受查询参数，唯一请求字段 `name` 为必填 string，去除首尾空白后不能为空，禁止 NUL 字符。
名称唯一且区分大小写，重复名称返回 409；不会自动合并或创建第二个同名标签。

```json
{
  "name": "奇幻"
}
```

成功返回 `201`，响应头包含 `Location: /api/v2/tags?id=3`：

```json
{
  "id": 3,
  "name": "奇幻"
}
```

### 11.3 修改：PUT /api/v2/tags?id=3

仅接受必填查询参数 `id`，请求体与创建相同，只提交 `name`。
成功返回 `200` 和修改后的标签对象；ID 保持不变，已有小说的引用继续有效。
不存在返回 404，与其他标签重名返回 409；失败时原标签和小说引用保持原样。

### 11.4 删除：DELETE /api/v2/tags?id=3

仅接受必填查询参数 `id`，无请求体。成功返回 `204`，不存在返回 404。
仍被任一小说引用时返回 `409`，不会自动移除小说上的引用。
先通过覆盖小说元信息从 `tagIds` 中移除该 ID，再删除标签。
删小说只级联清理关系表，不删除标签；改名只修改标签库，所有小说仍引用同一个 ID。
