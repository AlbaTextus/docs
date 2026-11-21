# 数据库

OAuth、ATHub、创作者平台和图床四个模块各用一套 PostgreSQL 数据库；邮件模块使用账户库，不单独建库。它们可以位于同一个 PostgreSQL 实例，但必须是不同的数据库，不能用同一个库的不同 schema 代替。

## 四套数据库

| 数据库 | 环境变量 | Schema 目录 | 建表命令 |
| --- | --- | --- | --- |
| 账户库 | `DATABASE_URL` | `prisma/oauth/` | `pnpm db:deploy` |
| 内容库 | `ATHUB_DATABASE_URL` | `prisma/athub/` | `npm run db:athub:deploy` |
| 创作者库 | `CREATPLAT_DATABASE_URL` | `prisma/creatplat/` | `npm run db:creatplat:deploy` |
| 图床库 | `IMAGE_DATABASE_URL` | `prisma/image/` | `npm run db:image:deploy` |

- 四套数据库的表定义集中在仓库根目录的 `prisma/` 下，每个库一个文件夹，相互独立。
- Prisma schema 是数据库结构的来源。Go 服务没有 Prisma Client，启动时只检查连接和结构，不会自动建库或建表。
- 统一服务启动时检查全部四套数据库，任何一套初始化失败都不会开始监听。
- 所有命令在仓库根目录执行，读取根目录的 `.env`。连接账号、密码和地址只放在环境配置里，不提交到仓库。
- 图床启动时会检查实际连接到的数据库，拒绝指向账户库、内容库或创作者库。

## 建库与建表

先安装依赖。内容库的 Prisma 工具单独安装在 `modules/athub/`：

```bash
pnpm install --frozen-lockfile
npm run db:athub:install
```

数据库和运行账号建好、连接写入 `.env` 之后，依次为四套数据库建表：

```bash
pnpm db:deploy
npm run db:athub:deploy
npm run db:creatplat:deploy
npm run db:image:deploy
```

创作者库的连接账号拥有 `CREATEDB` 权限时，可以先用 `npm run db:creatplat:create` 建库；它只创建配置中指定且尚不存在的数据库。建表前可用 `pnpm db:validate`、`npm run db:athub:validate`、`npm run db:creatplat:validate`、`npm run db:image:validate` 校验 schema。

表结构有变化时重新执行对应的建表命令，再启动新版本；结构不符合程序要求时服务拒绝启动。

`pnpm db:seed` 只用于开发环境：它会创建或更新管理员账户和示例客户端，并输出开发凭据。不要把它当作部署步骤，也不要在生产环境使用它的默认凭据。

## 测试用数据库

集成测试使用单独的连接配置，在临时 schema 中运行并在结束后清理，不向业务表写入测试数据；未配置时相关测试跳过。

| 变量 | 用途 |
| --- | --- |
| `ATHUB_TEST_DATABASE_URL` | 内容模块的真实 PostgreSQL 集成测试 |
| `OAUTH_TEST_DATABASE_URL`、`CREATPLAT_TEST_DATABASE_URL` | 账户库与创作者库的分库集成测试，需指向两个不同的数据库 |

测试命令见[开发与目录约定](/deploy/development)。
