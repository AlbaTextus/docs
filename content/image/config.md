# 配置

| 配置 | 用途 |
| --- | --- |
| `IMAGE_DATABASE_URL` | 必填，独立 PostgreSQL 数据库 |
| `IMAGE_HTTP_ADDR` | 默认 `:8002` |
| `IMAGE_PUBLIC_URL` | 公开根地址，本地默认 `http://localhost:8002` |
| `IMAGE_LOCAL_ROOT` | 必填，已有本地对象目录，不存在时拒绝启动 |
| `IMAGE_TEMP_ROOT` | 上传和分块临时文件，默认 `temp/image` |
| `IMAGE_LEGACY_HTTP_ADDR` | 可选，旧端口的文件兼容监听；本地当前为 `127.0.0.1:8082` |
| `IMAGE_LEGACY_SQLITE` | 迁移工具读取的原 SQLite |
| `IMAGE_MAX_UPLOAD_BYTES` | 默认 512 MiB |
| `IMAGE_MAX_CHUNK_BYTES` | 默认 20 MiB |
| `IMAGE_MAX_CHUNKS` | 默认 1000 |
| `IMAGE_UPLOAD_TTL` | 分块会话有效期，默认 24h |
| `IMAGE_HTTP_TIMEOUT` | 大文件读写期限，默认 10m |
| `IMAGE_MAX_UPLOAD_SESSIONS` | 单个账户或 Key 可同时保留的未完成分块上传数，默认 20，必须为正 |
| `IMAGE_DATABASE_MAX_CONNS` | 图床库连接池大小；默认 `0`，表示沿用连接地址中的 `pool_max_conns`，未指定时为 10 |

OAuth 头像和创作者封面/插图的 Go 调用已改为 `/api/v2/categories/...`。`IMGBED_URL` 指向图床根地址，`IMGBED_API_TOKEN` 使用迁入 OAuth 的上传 Key。站点及原图床前端未在本轮修改。

Docker Compose 另外使用 `IMAGE_COMPOSE_DATABASE_URL` 和 `IMAGE_COMPOSE_LOCAL_ROOT`，见 [Docker Compose](/deploy/docker)。
