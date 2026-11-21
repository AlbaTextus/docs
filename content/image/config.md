# 配置

| 配置 | 用途 |
| --- | --- |
| `IMAGE_DATABASE_URL` | 必填，独立 PostgreSQL 数据库 |
| `GATEWAY_HTTP_ADDR` | 图床与其他模块共用的后端监听地址，默认 `:8010` |
| `IMAGE_PUBLIC_URL` | 公开根地址 |
| `IMAGE_LOCAL_ROOT` | 必填，已有本地对象目录，不存在时拒绝启动 |
| `IMAGE_TEMP_ROOT` | 上传和分块临时文件，默认 `temp/image` |
| `IMAGE_MAX_UPLOAD_BYTES` | 默认 512 MiB |
| `IMAGE_MAX_CHUNK_BYTES` | 默认 20 MiB |
| `IMAGE_MAX_CHUNKS` | 默认 1000 |
| `IMAGE_UPLOAD_TTL` | 分块会话有效期，默认 24h |
| `IMAGE_HTTP_TIMEOUT` | 大文件读写期限，默认 10m |
| `IMAGE_MAX_UPLOAD_SESSIONS` | 单个账户或 Key 可同时保留的未完成分块上传数，默认 20，必须为正 |
| `IMAGE_DATABASE_MAX_CONNS` | 图床库连接池大小；默认 `0`，表示沿用连接地址中的 `pool_max_conns`，未指定时为 10 |

OAuth 头像、背投和创作者封面/插图由后端在同一进程内直接保存到图床，不经 HTTP 和上传 Key。保存后的地址以 `IMAGE_PUBLIC_URL` 为根，生产环境须把它设为浏览器可访问的 HTTPS 地址。

各变量在本地与生产环境的取值见[环境变量](/deploy/environment)。Docker Compose 另外使用 `IMAGE_COMPOSE_DATABASE_URL` 和 `IMAGE_COMPOSE_LOCAL_ROOT`，见 [Docker Compose](/deploy/docker)。
