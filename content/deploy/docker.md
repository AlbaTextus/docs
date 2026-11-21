# Docker Compose

完成[本地快速开始](/deploy/local)中的环境配置和数据库初始化后，可以由 Compose 启动完整服务：

```bash
docker compose up --build -d
```

当前 [docker-compose.yml](https://github.com/AlbaTextus/atnexus/blob/main/docker-compose.yml) 是本地开发配置，固定使用本地地址和开发环境，不会自动建表。Go 容器只接收 `environment` 中列出的变量：**目前未透传 `TURNSTILE_*` 和 `CUSTOM_OAUTH_AVATAR_FIELD`**，使用这些功能时需在 Compose 配置或覆盖文件中补充。只修改根目录 `.env` 不会把未列出的变量自动注入容器。

Compose 项目与后端服务均名为 `atnexus`。账户库和内容库的数据卷默认名为 `oauth_oauth-postgres`、`oauth_athub-postgres`，可用 `ACCOUNT_POSTGRES_VOLUME`、`ATHUB_POSTGRES_VOLUME` 指定其他卷。停止服务时不要使用 `down -v`，否则数据卷会被删除。

## 服务与端口

| 服务 | 镜像或构建 | 宿主端口 | 说明 |
| --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | `5432` | 账户库 |
| `athub-postgres` | `postgres:16-alpine` | `5433` | 内容库 |
| `creatplat-postgres` | `postgres:16-alpine` | `5434`，可用 `CREATPLAT_POSTGRES_PORT` 修改 | 创作者库；宿主机执行 Prisma 命令时 `CREATPLAT_DATABASE_URL` 使用这个端口 |
| `atnexus` | 根目录 `Dockerfile` | `8010` | Go 后端，五个模块共用唯一的聚合端口 |
| `web` | `web/Dockerfile` | `3288` | Next.js 前端 |

后端镜像以静态方式编译，运行在 distroless 的非 root 用户下。Compose 里没有图床数据库容器：图床库使用外部 PostgreSQL，图片目录以绑定挂载的方式挂到容器的 `/data/images`。上传与分块的临时文件保存在具名卷 `image-temp`（容器内 `/var/lib/atnexus/image-temp`），重建容器后未完成的分块上传可以继续。

`atnexus` 服务带有健康检查。运行镜像里没有 shell 和 HTTP 客户端，由 `/atnexus healthcheck` 请求聚合入口的 `/api/v1/healthz`，返回 200 才算健康。`web` 等后端健康后才启动，并通过容器内地址 `http://atnexus:8010` 转发账户与创作者操作。

## 启动前必须设置

以下变量缺失时 Compose 会直接报错退出：

| 变量 | 说明 |
| --- | --- |
| `CLIENT_SECRET_ENCRYPTION_KEY` | 客户端密钥加密密钥 |
| `CREATPLAT_POSTGRES_PASSWORD` | 创作者库容器的账号密码 |
| `CREATPLAT_COMPOSE_DATABASE_URL` | 容器网络内的创作者库连接，主机名为 `creatplat-postgres` |
| `IMAGE_COMPOSE_DATABASE_URL` | 独立图床库的连接，指向 Compose 之外的 PostgreSQL |
| `IMAGE_COMPOSE_LOCAL_ROOT` | 宿主机上已有的图片目录；目录不存在时不会自动创建 |
| `IMAGE_PUBLIC_URL` | 图床对外的根地址 |

`SMTP_*` 也不在后端容器接收的变量中，因此默认的 Compose 环境下邮箱注册与验证处于暂停状态；需要时与 `TURNSTILE_*` 一样在 Compose 配置或覆盖文件中补充。

创作者库数据卷默认名为 `atnexus_creatplat-postgres`，可用 `CREATPLAT_POSTGRES_VOLUME` 指定已有的卷。
