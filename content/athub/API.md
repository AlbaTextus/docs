# ATHub API 文档

版本日期：2026-11-01。本文覆盖 Go 服务全部公开 API，包括获取、上传、覆盖和删除。

## 1. 地址、鉴权与通用约定

- 请求直接发送到 ATHub **Go 服务**。
- 对外服务地址：`https://api.albatextus.com`。本文全部调用示例使用此 HTTPS 地址。
- 自托管时，默认监听 `http://127.0.0.1:8080`，由服务端 `HTTP_ADDR` 决定；与 OAuth 同机运行时可改为 `http://127.0.0.1:8090`，避免端口冲突。
- 路径不带 `/api` 前缀，不接受末尾 `/`，例如使用 `/upload` 而不是 `/api/upload/`。
- 生产环境使用 HTTPS。接口面向服务端或采集程序，不提供浏览器跨域 CORS 支持。

### 请求头

| 键 | 必填 | 值 |
| --- | --- | --- |
| `Authorization` | 所有请求必填 | `Bearer <API_TOKEN>`，使用 Go 服务配置的服务密钥，不是 OAuth access token。 |
| `Content-Type` | 有 JSON 请求体的 POST/PUT 必填 | `application/json`，也接受 `application/json; charset=utf-8`。 |
| `Accept` | 可选 | 推荐 `application/json`。 |

服务密钥具有全库读写权限，不要放进网页、客户端公开包或日志。
除鉴权外，没有额外签名字段。GET/DELETE 参数放在 URL 查询字符串；POST/PUT 数据放在 JSON 请求体。

### 编码、类型和限制

| 项目 | 规则 |
| --- | --- |
| 请求体 | 一个 UTF-8 JSON 对象，无 BOM。拒绝顶层数组、`null`、多段 JSON 和未知字段。 |
| 文件上传 | 将 `.json` 文件内容作为整个 HTTP 请求体发送，不使用 `multipart/form-data`。 |
| 大小上限 | 每个请求体最多 **8 MiB = 8,388,608 字节**，包含 JSON 结构、转义字符等。 |
| 单批上传 | `/upload` 最多 200 个卷、1000 个章节，还须满足 8 MiB 限制。超过时分批发送。 |
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

分页列表接口采用下列字段，响应不含 `total`、`nextCursor` 或页码；`/toc` 为全量目录对象，不使用分页：

| 查询键 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `limit` | integer | 否 | `20` | `1` 至 `100`，每次最多返回的条数。 |
| `offset` | integer | 否 | `0` | `0` 至 `2147483647`，跳过的条数。 |

空列表返回 `[]`。按 `offset += limit` 继续读取；返回不足 `limit` 条即到达末页。
分页没有跨请求快照保证，上传和读取同时进行时可能看到数据变化。

## 2. 接口总览

| 方法 | 路径 | 用途 | 成功状态 |
| --- | --- | --- | --- |
| GET | `/platforms` | 获取平台列表或单个平台 | 200 |
| POST | `/platforms` | 新建平台 | 201 |
| GET | `/authors` | 获取作者列表或单个作者 | 200 |
| POST | `/authors` | 新建作者标识 | 201 |
| GET | `/novelinfo` | 获取小说列表或小说元信息 | 200 |
| POST | `/novelinfo` | 新建小说，仅元信息 | 201 |
| PUT | `/novelinfo?id=...` | 完整覆盖小说元信息 | 200 |
| DELETE | `/novelinfo?id=...` | 删除小说及全部卷、章节 | 204 |
| GET | `/volumes` | 获取卷列表或一个卷 | 200 |
| PUT | `/volumes` | 上传一个卷，不存在则新增、存在则覆盖卷名 | 200 |
| DELETE | `/volumes?novelId=...&order=...` | 删除空卷 | 204 |
| GET | `/toc?novelId=...` | 一次获取全书卷与章节目录，不含正文 | 200 |
| GET | `/content` | 获取章节列表或一个章节，包含正文 | 200 |
| PUT | `/content` | 上传一个章节，不存在则新增、存在则覆盖 | 200 |
| DELETE | `/content?novelId=...&order=...` | 删除一个章节 | 204 |
| POST | `/upload` | 一次创建小说并导入卷/章节，或给已有小说批量续传 | 201 / 200 |
| GET | `/stats` | 获取所有平台的统计与汇总 | 200 |

POST 不带查询参数；`PUT /volumes`、`PUT /content` 也不带查询参数。
不支持 PATCH。平台和作者目前只提供获取与创建，没有修改/删除接口。

## 3. 平台

### 3.1 获取：GET /platforms

获取单个：`GET /platforms?id=1`。

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 单条模式必填 | 平台 ID；不能与任何其他参数组合。不存在返回 404。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

列表示例：`GET /platforms?limit=20&offset=0`，按 ID 升序。

### 3.2 创建：POST /platforms

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

`201` 响应，同时返回 `Location: /platforms?id=1`：

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

### 4.1 获取：GET /authors

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 单条模式必填 | 作者 ID，不得与其他参数组合；不存在返回 404。 |
| `platformId` | integer | 否 | 仅列表模式，筛选所属平台；平台不存在或没有作者时返回空数组。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

示例：`GET /authors?id=2` 或 `GET /authors?platformId=1&limit=20&offset=0`。
列表按 ID 升序。

### 4.2 创建：POST /authors

```json
{
  "platformId": 1
}
```

唯一请求键 `platformId` 为必填 integer，必须引用已存在的平台，否则返回 400。
当前作者表没有姓名、来源作者 ID 等字段；不要提交 `name`、`authorName` 等额外键。

`201` 响应，同时返回 `Location: /authors?id=2`：

```json
{
  "id": 2,
  "platformId": 1
}
```

响应的 `id` 是生成的作者标识，`platformId` 为所属平台。
GET 单条结构相同，GET 列表为此类对象的数组。重复 POST 会创建新的作者标识。

## 5. 小说元信息

### 5.1 获取：GET /novelinfo

获取单本：`GET /novelinfo?id=10`。
获取列表：`GET /novelinfo?platformId=1&authorId=2&limit=20&offset=0`。

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 单条模式必填 | 小说 ID，不能和其他参数组合；不存在返回 404。 |
| `platformId` | integer | 否 | 仅列表模式，平台筛选。 |
| `authorId` | integer | 否 | 仅列表模式，作者筛选；与平台筛选同时提供时取交集。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

列表按小说 ID 降序；筛选无结果时返回 `[]`。
元信息不嵌套卷或章节，分别使用 `/volumes` 和 `/content` 获取。

### 5.2 创建：POST /novelinfo

```json
{
  "platformId": 1,
  "authorId": 2,
  "title": "示例小说",
  "summary": "小说简介",
  "coverUrl": "https://example.com/cover.jpg",
  "status": "ONGOING"
}
```

### 5.3 覆盖：PUT /novelinfo?id=10

URL 只允许必填查询键 `id`。请求体与 POST 完全相同。
这是**完整替换而非局部更新**，省略可空字段会清空，省略状态会恢复为 `ONGOING`。
不存在返回 404。

### 5.4 小说写入字段：POST、PUT 及 /upload.novel 共用

| 请求键 | 类型 | 必填 | 默认/约束 |
| --- | --- | --- | --- |
| `platformId` | integer | 是 | 已存在的平台 ID。 |
| `authorId` | integer / null | 否 | 省略/null 保存为 null；非空时作者必须存在且属于 `platformId`。 |
| `title` | string | 是 | 去除首尾空白后不能为空。书名不唯一，不按书名自动去重。 |
| `summary` | string / null | 否 | 省略/null 保存为 null；空字符串与 null 不同。 |
| `coverUrl` | string / null | 否 | 省略/null 保存为 null；不验证或下载图片。 |
| `status` | string | 否 | `ONGOING` 连载中或 `COMPLETED` 已完结，区分大小写。省略/null/空字符串按 `ONGOING`。 |

POST 成功返回 `201` 和 `Location: /novelinfo?id=10`；PUT 成功返回 `200`。
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
  "createdAt": "2026-10-29T04:00:00Z",
  "updatedAt": "2026-10-29T04:00:00Z"
}
```

`id`、`createdAt`、`updatedAt` 为只读生成字段；其余键定义与写入字段表相同。
可空字段即使为 null 也会返回。GET 列表为上述对象组成的数组。

### 5.5 删除：DELETE /novelinfo?id=10

只接受必填 `id` 查询键，无请求体。成功返回 `204`；不存在返回 404。
**永久删除这部小说及全部卷、章节**，不会删除平台或作者。

## 6. 卷

### 6.1 获取：GET /volumes

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `novelId` | integer | 是 | 所属小说 ID。 |
| `order` | integer | 单条模式必填 | 小说内的卷序号，不是卷 ID；不得与分页参数组合。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

示例：`GET /volumes?novelId=10&order=1`，或 `GET /volumes?novelId=10&limit=20&offset=0`。
列表按 `order` 升序。小说存在但无卷/该页为空时返回 `[]`，小说不存在返回 404。
单条模式下卷不存在也返回 404。卷响应不包含章节正文或章节计数。

### 6.2 上传一个卷：PUT /volumes

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

### 6.3 删除：DELETE /volumes?novelId=10&order=1

只允许两个必填查询键 `novelId`、`order`，无请求体。
成功返回 `204`，不存在返回 404。
卷仍被章节引用时返回 `409`，不删除任何章节。先用 `/content` 或 `/upload` 将章节移出该卷，或先删除章节。

## 7. 章节正文

### 7.1 获取：GET /content

| 查询键 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `novelId` | integer | 是 | 小说 ID。 |
| `order` | integer | 单条模式必填 | **全书章节序号**，不得与分页参数组合。 |
| `limit` | integer | 否 | 仅列表模式，通用分页。 |
| `offset` | integer | 否 | 仅列表模式，通用分页。 |

示例：`GET /content?novelId=10&order=1`，或 `GET /content?novelId=10&limit=20&offset=0`。
列表按章节 `order` 升序，包含完整正文。小说存在但无章节/该页为空返回 `[]`；小说不存在返回 404。
单条模式下章节不存在也返回 404。
没有按卷筛选参数；客户端依据返回的 `volumeId` 分组。读取整本小说需逐页请求，不提供无上限全量正文路由。
只需标题与分卷关系时，使用第 7.4 节的 `/toc`，避免传输正文。

### 7.2 上传一个章节：PUT /content

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
`POST /content` 不支持，单章上传使用 PUT；批量上传使用 `POST /upload`。

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

### 7.3 删除：DELETE /content?novelId=10&order=1

只允许两个必填查询键 `novelId`、`order`，无请求体。
成功返回 `204`，小说或章节不存在返回 404。不重新编号其他章节，也不删除空卷。

### 7.4 获取全书目录：GET /toc?novelId=10

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
实际阅读时再用 `GET /content?novelId=10&order=2` 按需读取章节正文。

## 8. 批量上传：POST /upload

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
要修改小说元信息，另行使用 `PUT /novelinfo?id=10`。

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

新建返回 `201`，同时带 `Location: /novelinfo?id=10`；续传返回 `200`。

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
| `chapters` | array | 本批次章节回执，按请求数组顺序返回；未写章节时为 `[]`。不重复返回正文，完整章节用 GET /content 获取。 |
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

## 9. 存储统计：GET /stats

不接受查询参数，无请求体。返回 200：

```json
{
  "platforms": [
    {
      "id": 1,
      "name": "示例平台",
      "novelCount": 3,
      "chapterCount": 120,
      "storageBytes": 345678
    }
  ],
  "platformCount": 1,
  "novelCount": 3,
  "chapterCount": 120,
  "storageBytes": 345678,
  "updatedAt": "2026-10-29T04:00:00Z"
}
```

| 响应键 | 类型 | 说明 |
| --- | --- | --- |
| `platforms` | array | 平台统计列表，按平台 ID 升序；包括没有小说的平台，完全无平台时为 `[]`。 |
| `platforms[].id` | integer | 平台 ID。 |
| `platforms[].name` | string | 平台名称。 |
| `platforms[].novelCount` | integer | 该平台小说数。 |
| `platforms[].chapterCount` | integer | 该平台章节数。 |
| `platforms[].storageBytes` | integer | 该平台存储内容的 UTF-8 字节数。 |
| `platformCount` | integer | 平台总数。 |
| `novelCount` | integer | 所有平台小说总数。 |
| `chapterCount` | integer | 所有平台章节总数。 |
| `storageBytes` | integer | 所有平台内容字节数。 |
| `updatedAt` | string | 本次统计生成时间，不是数据库最后修改时间。 |

内容字节数包括小说标题、简介、封面链接、卷标题、章节标题和正文；
不含平台名、平台网址、ID、时间戳、索引、数据库行头、空闲空间或 JSON 传输开销。
不是磁盘文件大小。计数与字节数可能超过 32 位，客户端建议使用 64 位整数处理。

## 10. 错误响应与状态码

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
| 201 | 创建平台、作者、小说，或批量上传中新建小说成功。 |
| 204 | 删除成功，无响应体。 |
| 400 | 缺字段、未知字段/查询键、类型/范围错误、空标题/正文、NUL、JSON 错误、单批重复序号/数量超限、非法关联、批量模式冲突。 |
| 401 | 缺少/错误/重复的 Authorization。返回 `WWW-Authenticate: Bearer`。鉴权先于路由检查。 |
| 404 | 路径不存在，或获取/删除/更新的目标不存在；续传小说不存在。 |
| 405 | 路径不支持该请求方法，返回 `Allow` 头。 |
| 409 | 数据唯一性冲突，或试图删除仍包含章节的卷。 |
| 413 | JSON 请求体超过 8 MiB。 |
| 415 | JSON 写入请求没有正确的 `Content-Type`，包括 multipart 上传。 |
| 500 | 未预期服务或数据库错误，不返回数据库内部细节。 |
| 504 | 数据库请求上下文超时。 |

引用错误与目标不存在的区别：`PUT /content` 引用不存在的小说/卷是 400；
`GET /content` 获取不存在的小说/章节是 404；`POST /upload` 用不存在的 `novelId` 续传是 404。

## 11. 完整调用示例

以下示例要求 Go 服务已运行，`API_TOKEN` 已在调用端环境变量中设置。
不要将真实密钥写进文档或提交到 Git。

### 11.1 PowerShell：从零创建平台并上传

```powershell
$base = 'https://api.albatextus.com' # 自托管时改为实际 Go 服务地址
$headers = @{ Authorization = "Bearer $env:API_TOKEN" }

$platformJson = @{ name = 'My platform'; url = $null } | ConvertTo-Json
$platform = Invoke-RestMethod "$base/platforms" -Method Post -Headers $headers `
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

$result = Invoke-RestMethod "$base/upload" -Method Post -Headers $headers `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($upload))

$novelId = $result.novel.id
Invoke-RestMethod "$base/novelinfo?id=$novelId" -Headers $headers
Invoke-RestMethod "$base/volumes?novelId=$novelId" -Headers $headers
Invoke-RestMethod "$base/toc?novelId=$novelId" -Headers $headers
Invoke-RestMethod "$base/content?novelId=$novelId&order=1" -Headers $headers
```

### 11.2 上传 JSON 文件

把第 8.1 节 JSON 保存为 UTF-8 无 BOM 文件，替换真实平台/作者 ID。
下面假设文件在 `temp/upload.json`。这只是请求格式示例，不会自动读取本机文件路径。

```powershell
curl.exe --request POST 'https://api.albatextus.com/upload' `
  --header "Authorization: Bearer $env:API_TOKEN" `
  --header 'Content-Type: application/json; charset=utf-8' `
  --data-binary '@temp/upload.json'
```

不要使用 `-F file=@...`。接口接收 JSON 内容，不接受 `file`、`filePath`、`filename`、`encoding` 等额外字段。

### 11.3 续传下一批

```powershell
$nextBatch = @{
  novelId = $novelId
  chapters = @(
    @{ order = 2; volumeOrder = 1; title = 'Chapter 2'; content = 'Next chapter body.' }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod "$base/upload" -Method Post -Headers $headers `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($nextBatch))
```

重发这个续传请求会覆盖同一本书的第 2 章，不会创建第二本小说或重复章节。

### 11.4 分页获取全部章节

```powershell
$limit = 100
$offset = 0
do {
  $page = Invoke-RestMethod "$base/content?novelId=$novelId&limit=$limit&offset=$offset" -Headers $headers
  foreach ($chapter in $page) {
    # 在这里消费 chapter.id / volumeId / order / title / content / updatedAt
    $chapter
  }
  $offset += $limit
} while ($page.Count -eq $limit)
```

上传完成后再开始全量分页读取，可以避免边上传边分页产生的数据变化。
