# 模块与数据库

本页面向维护 atnexus 的人，说明 ATHub 模块在统一服务中的位置、鉴权方式和数据库迁移。调用接口请从[介绍与快速开始](/athub/overview)读起。

本目录是 atnexus 统一服务内独立维护的内容模块。宿主通过 `module.go` 初始化数据库、取得
HTTP Handler 并负责关闭连接池；模块不启动 HTTP 服务。只依赖本目录源码，不引用相邻
ATHub 工作目录。单独修改、测试模块后，由宿主重新编译发布。

来源为 `D:\AlbaTextus\athub` 的当前工作树，包括当时未提交的内容 API 精简和迁移。
来源仓库基准提交为 `2712860b88270266ad4e241fc2a94bbee8ddc7e7`。
这是源码合入，未建立 submodule 或 subtree 同步关系；后续源码以本目录为维护入口。
原工作目录保留。

## 当前宿主入口

ATN 主服务现在对外使用 `8005/api/v5/*`，由 `ATHUB_HTTP_ADDR` 配置。
本模块引擎仍使用 v2 路由，宿主通过边界适配转换并修正响应 Location；不重写已有权限和审计标签。
站内访问直接校验 OAuth session Cookie，外部 API Key 的管理和凭据校验也由 OAuth 提供。
审核、历史和修订的业务实现归 `modules/creatplat/`，公开入口为 `8004/api/v4/*`。
图片文件由[图床模块](/image/overview)保存。

以下列出宿主对外的 v5 接口；内容引擎内部继续保留 v2 契约，由宿主转换。

## HTTP 接口

宿主在同一进程中启动四个监听器：OAuth 使用 `8001`、图床使用 `8002`、creatplat 使用 `8004`、本模块对外使用 `8005`
（可由 `ATHUB_HTTP_ADDR` 修改）。公开内容接口使用 `/api/v5/`：

| 路径 | 方法 |
| --- | --- |
| `/api/v5/platforms` | GET、POST |
| `/api/v5/authors` | GET、POST、PUT |
| `/api/v5/tags` | GET、POST、PUT、DELETE |
| `/api/v5/novelinfo` | GET、POST、PUT、DELETE |
| `/api/v5/volumes` | GET、PUT、DELETE |
| `/api/v5/toc` | GET |
| `/api/v5/content` | GET、PUT、DELETE |
| `/api/v5/upload` | POST |

外部 Key 请求使用 `Authorization: Bearer <API_KEY>`。登录用户在 OAuth `8001/api/v1/account/key`
自动生成唯一的永久 Key，支持重置和停用；宿主注入的鉴权与记账中间件校验归属、当前 Key、停用状态和用户启用状态。
Key 只在生成或重置时显示明文，账户库只保存 SHA-256 哈希。停用后不会自动恢复，重置保留历史调用记录。
原全局密钥、OAuth access token 和旧个人密钥不能替代新 Key。
站内小说库使用 OAuth session Cookie，并通过 OAuth 权威接口逐次核验会话；内容准入和业务权限仍由原适配器执行，无需输入或生成个人 Key。旧 `ats_` 凭证仅保留过渡兼容，前端不再申请。
本模块仍只接收宿主鉴权后的请求，不处理用户或会话。
没有 `/athub` 中间路径。旧 `/api/content` 等路径不提供兼容。

作者支持可空的 `name`（最多 200 个字符），GET 单项和列表都会返回此字段。
`POST /api/v5/authors` 可提交 `{"platformId":1,"name":"作者笔名"}`；
省略姓名仍兼容原请求。`PUT /api/v5/authors?id=3` 提交 `{"name":"作者笔名"}`，
只修改姓名，不改作者 ID、所属平台或小说关联。名称首尾空白会清理；
`null`、空字符串或省略 `name` 清空姓名，包含 NUL 或超过 200 字符返回 400。
修改接口接受获授权的个人 API Key 或站内 session；session 写入还需通过来源校验。旧只读凭证不允许 PUT。
现有请求字段、分页、8 MiB JSON 上限、批量上传事务、分卷和章节排序规则保持不变。
创建资源返回的公开 `Location` 使用 `/api/v5/`。

### 插图

插图和布局的公开接口统一由 [创作者平台 `/api/v4`](/creatplat/api) 提供。
`GET /api/v4/account/athub/novels/{id}/illustrations?limit=100&offset=0` 返回按上传顺序排列的插图数组，
支持现有分页规则。作品不存在返回 404，没有插图返回空数组。
每项包含 `id`、`novelId`、`url`、`sha256`、`width`、`height`、`createdAt`。

网站通过 creatplat 的 `POST /api/v4/account/athub/novels/{id}/illustrations` 上传，
请求为 `multipart/form-data`，单个 `file` 字段。界面支持选择多张图片，逐张提交并单独报告失败。
同一接口也接受个人 API Key（`Authorization: Bearer <API_KEY>`），供服务端程序直接上传图片文件；
带有 `Authorization` 请求头的请求按 Key 调用处理，不读取 Cookie。
宿主验证登录会话与 CSRF（或个人 Key）以及当前插图上传权限后，校验实际图片内容，
接受 JPG、PNG、WebP、GIF（GIF 使用首帧）；原图最大 5 MiB、单边 8192 像素、总像素 1600 万。
图片去除元数据，按原比例缩小至最长边 4096 像素以内，并转换为 JPEG；
透明区域使用白底。宿主在同一进程内直接保存到图床的
`book/{novelId}/illustrations/` 目录，不经 HTTP 和上传 Key。
Key 调用先完成 Key 核对、记账和权限判断，再读取图片。

上传后服务端在同一请求中把图片 URL、归一化后图片的 SHA-256 和宽高交给内部内容引擎，客户端无需再次调用接口。旧 `v5` 插图和布局入口不再公开。
上传按 `upload` 权限记账并遵循现有审核策略：直接保存返回 201；
需要审核时返回 202 和 `review_id`，审核通过后才公开显示。插图变更进入作品历史和贡献者记录。
同一作品内相同校验值只保存一条记录，重复提交不会增加图片或历史记录。

网站按需使用下列 GET 查询，原有列表的数组响应保持兼容：

- `/api/v5/novelinfo?view=page&limit=24&offset=0&sort=updated&q=关键词` 返回
  `{"items":[...],"total":123}`。`sort` 支持 `updated`、`title`，并支持原有
  `platformId`、`authorId`、`tagId` 筛选；`q` 按 NFKC 归一化后匹配书名或作者，最多 200 字符。
- `/api/v5/authors?ids=1,2,3` 批量返回指定作者，最多 100 个正整数 ID，不能组合其他参数。
- `novelinfo`、`authors`、`tags`、`platforms` 支持单独的 `?view=count`，返回 `{"total":123}`。

宿主模式下，内容模块在鉴权之后缓存成功的 GET 响应，合并同路径的并发回源。
普通内容有效期 30 秒，标签和平台有效期 5 分钟；不缓存错误或超过 1 MiB 的响应，
总容量不超过 128 项和 16 MiB。写入成功及宿主批准的审核写入都会使本进程缓存失效：
插图与插图布局的写入只清除插图相关的响应，其他写入清空全部缓存；
旧读请求不能在失效后重新填入缓存。缓存命中仍需通过宿主鉴权、权限检查和 API Key 记账。
这是进程内缓存；多实例部署与绕过 API 的数据库修改由有效期兜底。HTTP 响应仍为 `no-store`，
不将账户保护下的内容变为公共 CDN 缓存。

## 数据库与迁移

`ATHUB_DATABASE_URL` 专用于内容库，与宿主 `DATABASE_URL` 分开配置。
本目录 `prisma/` 保留完整历史迁移，宿主账户库的迁移仍由根目录 `prisma/` 管理。
可连接原 ATHub 数据库，无需搬运内容数据；启动只检查连接与 schema，不自动迁移。
内容库保存平台、作者、小说、标签库、小说标签关系、卷和章节。`athub_api_keys`、`athub_api_calls` 两张表均由
宿主账户库维护；本模块只提供注入接口，不连接账户库、不定义用户或调用统计表。

`20261115000000_novel_illustrations` 增量创建 `Illustration` 表，通过外键关联作品，
并按作品和图片校验值去重。已有作品默认没有插图；删除作品时关联记录一并删除。
部署包含插图功能的服务前，先执行内容库迁移。

在统一仓库根目录执行：

```powershell
npm run db:athub:install
# Prisma 7 在此目录执行，从统一仓库根目录读取 .env。
npm run db:athub:validate
npm run db:athub:deploy
```

迁移前备份数据库。其中既有 `20261103000000_remove_user_api` 迁移会删除
`ApiUser`、`ApiKey`、`ApiUsage`，保留平台、作者、小说、卷与章节。

`20261110030000_add_tags` 增量创建 `Tag` 与 `NovelTag`，已有小说默认无标签，原内容和时间不变。
标签名称唯一，小说元信息用 `tagIds` 引用独立标签库，不重复存储标签名称。
标签可以跨平台复用；小说列表支持 `tagId` 筛选。创建小说和批量上传的 `novel` 都可传入 `tagIds`。
覆盖小说元信息时省略 `tagIds`、传 `null` 或 `[]` 清空引用；任一标签不存在时整个事务回滚。
续传保留标签，标签改名保留 ID；删除仍被引用的标签返回 `409`。
删除小说只清理标签关系，保留标签库。新版本启动前先在统一仓库根目录执行 `npm run db:athub:deploy`。

创建或覆盖小说元信息时，可以用 `authorName` 代替 `authorId`，按名称复用当前平台的作者，不存在时新增；两者不能同时传入非空值。`tagNames` 按名称复用或新增标签，并与 `tagIds` 合并去重。批量上传的 `novel` 对象也支持这些字段。名称解析与小说更新在同一事务中完成，只更换当前作品的关联，不修改共享作者、标签的名称；取消、保存失败或尚待审核时不会提前创建资料。

## 验证

作者姓名功能需先应用 `20261110040000_add_author_name` 内容库迁移，仅新增
`Author.name VARCHAR(200)` 可空字段。已有作者和小说关联保留，历史姓名默认为 NULL，
不会推测或自动填入示例姓名。前端有姓名时显示笔名，无姓名时继续显示作者编号。

```powershell
# 在统一仓库根目录执行；全部 Go 业务模块使用根 go.mod，测试排除 temp 过程脚本。
npm run test:go
go vet ./modules/athub/...
```

设置 `ATHUB_TEST_DATABASE_URL` 后可运行真实 PostgreSQL 集成测试；测试创建并清理临时
schema，不在业务表中写入测试数据。未配置时这些测试跳过。

## 维护方式与凭据

ATHub 保留自己的存储实现、测试和 Prisma 迁移；Go 依赖统一由根 `go.mod` 管理，准入层位于 `modules/athub/access/`。
维护内容功能时修改该目录，再重新构建统一程序。普通 Git 克隆即可取得全部源码，
不需要相邻 ATHub 目录或初始化子模块。原 ATHub 工作目录保留。

v5 的外部调用使用登录用户在 `8001/api/v1/account/key` 创建的个人 API Key，由 OAuth 统一管理与校验；
站内调用使用 OAuth session Cookie，不接受原全局密钥或用 OAuth access token 替代 session。
每个 Key 归属一个用户，创建时仅返回一次明文，账户库只保存哈希。
账户维护模式沿用 v1 范围；内容请求不经过账户维护拦截。
`8001/api/v1/healthz` 检查账户库，账户维护状态仍返回 `433`；`8005/api/v5/healthz` 检查内容库，不需要 Key，也不计入调用记录，
数据库不可用返回 `503`。任一端口绑定失败会释放已绑定端口并退出整个程序。
