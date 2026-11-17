# 模块概览

该模块由根 Go module 管理，通过 `cmd/server` 与 OAuth、creatplat、ATHub 在同一进程运行。业务 API 位于 `8002/api/v2`，文件仍以 `/file/<原文件 ID>` 访问，也支持 `/api/v2/file/<ID>`。原 imgbed 前端保持原样，本次没有迁移它的页面、构建或交互。

图片元数据使用独立 PostgreSQL 数据库；本地文件仍使用已有存储目录，S3 对象继续按渠道及原对象键读取。独立数据库可以建在已有 PostgreSQL 实例中，无需另开数据库服务。启动时检查实际数据库身份，拒绝将图床指向账户、内容或创作者库。

配置项见[配置](/image/config)，从原 SQLite 图床升级见[迁移与升级](/image/migration)，故障处理见[兼容边界与失败恢复](/image/recovery)。

## 认证与接口

- 注入 OAuth 的 `auth.Verifier`，直接校验同一 Cookie session，不建立另一套图床登录会话。
- 普通已登录账户可上传；管理员可列表、管理、删除。修改请求携带 `X-AlbaTextus-Client: account-center`，来源受宿主 CORS/CSRF 约束。
- 外部 Key 在 OAuth 账户库按 SHA-256 存储，由 `GET/POST/PUT/DELETE /api/v1/admin/image/keys` 管理，创建时仅返回一次明文。`upload/list/delete/manage` 为独立权限。
- 支持 `Authorization: Bearer <Key>` 和旧版直接放置 Key 的格式。无效 Key 不回退到 Cookie；过期、撤销、权限不足均拒绝。
- `/file/` 读取公开，`Block` 文件禁止公开读取。`?from=admin` 预览要求管理员 session 或 `manage` Key。
- 同进程的 OAuth 与 creatplat 在校验登录会话和权限后直接调用图床保存头像、背投、封面和插图，不经 HTTP 和 Key，结果与分类上传接口相同。这条路径不记录上传 IP，也不应用 IP 黑名单。外部 Key 只用于进程外的调用方。

| 能力 | 新接口（均加 `/api/v2`） |
| --- | --- |
| 普通/分块上传 | `POST /upload`，保留 `initChunked/chunked/merge/cleanup` 参数 |
| 分类 | `POST /categories/<分类>/upload`、`GET /categories/<分类>/list` |
| 目录、渠道、筛选 | `GET /directoryTree`、`/channels`、`/manage/list` |
| 删除 | `DELETE /manage/delete/<ID>`、`POST /manage/delete/batch` |
| 移动、重命名、封禁 | `/manage/move/<ID>`、`rename/<ID>`、`block/<ID>`、`unblock/<ID>`，使用 POST/PATCH |
| 元数据、标签 | `/manage/metadata/<ID>`、`tags/<ID>`、`tags/batch`、`tags/autocomplete` |
| 容量 | `/manage/quota`，从真实记录计算 |
| 存储配置 | `GET/POST /manage/sysConfig/upload`，读取隐藏 S3 凭据，修改时空凭据保留旧值 |
| IP 黑名单 | `GET/PUT /manage/cusConfig/blockipList` |
| 导出、记录恢复 | `/manage/batch/list`、`batch/settings`、`POST /manage/batch/restore/chunk` |

分类为 `user`、`user/avatars`、`user/backgrounds`、`book`、`book/covers`、`book/illustrations`、`forum`。新增文件使用 `user/<UUID>/avatars/...`、`book/<ID>/covers/...` 等结构，查询兼容旧分类在前的路径。上传返回数组中的 `src`；`returnFormat=full` 使用 `IMAGE_PUBLIC_URL`。

文件支持 GET、HEAD、Range，公开读取支持条件请求（内容未变化时返回 304），并直接流式响应。本地存储使用 `os.Root` 限制路径逃逸，独占保留和原子链接防止覆盖。分块所有者、渠道、有效期、每块摘要及合并回执在 PG 维护，重复合并返回同一结果；合并事务限制并发数量，为文件提交保留数据库连接。
