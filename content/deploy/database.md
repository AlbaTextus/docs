# 数据库与迁移

四个模块各用一套 PostgreSQL 数据库。它们可以位于同一个 PostgreSQL 实例，但必须是不同的数据库，不能用同一个库的不同 schema 代替。

## 四套数据库

| 数据库 | 环境变量 | 迁移目录 | 部署命令 |
| --- | --- | --- | --- |
| 账户库 | `DATABASE_URL` | `prisma/` | `pnpm db:deploy` |
| 内容库 | `ATHUB_DATABASE_URL` | `modules/athub/prisma/` | `npm run db:athub:deploy` |
| 创作者库 | `CREATPLAT_DATABASE_URL` | `modules/creatplat/prisma/` | `npm run db:creatplat:deploy` |
| 图床库 | `IMAGE_DATABASE_URL` | `modules/image/prisma/` | `npm run db:image:deploy` |

- Prisma schema 与迁移是数据库结构的来源。Go 服务没有 Prisma Client，启动时只检查连接和结构，不会自动建库、建表或迁移。
- 统一服务启动时检查全部四套数据库，任何一套初始化失败都不会开始监听。
- 所有命令在仓库根目录执行，读取根目录的 `.env`。连接账号、密码和地址只放在环境配置里，不提交到仓库。
- 图床启动时会检查实际连接到的数据库，拒绝指向账户库、内容库或创作者库。

## 全新安装

先安装依赖。内容库的 Prisma 工具单独安装在 `modules/athub/`：

```bash
pnpm install --frozen-lockfile
npm run db:athub:install
```

数据库和运行账号建好、连接写入 `.env` 之后，依次迁移四套数据库：

```bash
pnpm db:deploy
npm run db:athub:deploy
npm run db:creatplat:deploy
npm run db:image:deploy
```

创作者库的连接账号拥有 `CREATEDB` 权限时，可以先用 `npm run db:creatplat:create` 建库；它只创建配置中指定且尚不存在的数据库。迁移前可用 `pnpm db:validate`、`npm run db:athub:validate`、`npm run db:creatplat:validate`、`npm run db:image:validate` 校验 schema。

`pnpm db:seed` 只用于开发环境：它会创建或更新管理员账户和示例客户端，并输出开发凭据。不要把它当作部署步骤，也不要在生产环境使用它的默认凭据。

## 升级已有安装

1. 备份四套数据库，以及 `CLIENT_SECRET_ENCRYPTION_KEY`。加密密钥必须与账户库一起保存，升级时沿用原值。
2. 停止旧版本后端，包括仍在写入的旧程序。
3. 对有新迁移的数据库执行上面的部署命令。迁移是独立的发布步骤，不随程序启动执行。
4. 账户库里还保留旧审核和历史数据时，执行 `npm run db:creatplat:import` 导入并核对，步骤见[创作者平台数据库](/creatplat/database)。
5. 从原 SQLite 图床升级时，停写并备份后执行 `npm run db:image:import -- -source <SQLite 绝对路径>`，步骤见[图床迁移与升级](/image/migration)。
6. 启动新版本，确认四个模块的健康检查返回 200，地址见[健康检查](/deploy/production)。已有实例不需要重复执行 seed。

## 需要留意的迁移

下列迁移会删除数据或是某项功能的前提，执行前先确认备份。

| 数据库 | 迁移 | 说明 |
| --- | --- | --- |
| 账户库 | `20261101000000_remove_communications` | 永久删除 `mail_deliveries` 和 `communications` 表及其中的消息、发送记录 |
| 账户库 | `20261110000000_athub_user_keys`、`20261110010000_athub_single_key`、`20261110020000_athub_admin_disable` | 个人 Key、单 Key 模式与管理员禁用，见 [ATHub 密钥与权限](/oauth/athub-key) |
| 账户库 | `20261117000000_athub_key_call_counter` | 个人 Key 的已放行调用计数列，迁移时按调用记录回填一次；新版本启动时要求该列存在。须在旧后端停止后执行，旧程序在迁移之后放行的调用不会计入额度 |
| 内容库 | `20261103000000_remove_user_api` | 删除旧 `ApiUser`、`ApiKey`、`ApiUsage` 表及数据，保留平台、作者、小说、卷与章节 |
| 内容库 | `20261110030000_add_tags`、`20261110040000_add_author_name` | 标签库与作者姓名 |
| 内容库 | `20261115000000_novel_illustrations`、`20261115010000_illustration_layout` | 插图与插图布局 |
| 内容库 | `20261116000000_novel_abandoned_status` | 小说状态 `ABANDONED` |
| 内容库 | `20261117000000_novel_list_indexes`、`20261117010000_chapter_word_count`、`20261117020000_author_name_indexes` | 列表索引、章节字数生成列与作者姓名索引；全书目录的 `wordCount` 依赖其中的字数列 |
| 内容库 | `20261117030000_chapter_content_digest` | 章节正文的摘要与长度生成列 `contentHash`、`contentLength`，记录修订历史时不必读取正文；新版本启动时要求这两列存在。迁移会重写一次章节表并回填已有章节，章节多时耗时较长 |
| 创作者库 | `20261116010000_creator_database` | 建立独立创作者库的审核与历史表 |
| 图床库 | `20261116020000_image_database` | 建立独立图床库；账户库同时需要 `20261116020000_image_api_keys` |
| 图床库 | `20261117020000_image_list_order` | 重建文件列表的时间索引，使其与列表的排序方式一致 |

积分与支付已迁出到独立的 Credit 服务，旧钱包表保留为只读迁移来源。在旧账户库上运行 `prisma migrate dev` 可能提出删除这些已移出的表，完成迁移及核对前不要接受，说明见 [OAuth 模块概览](/oauth/overview)。

## 测试用数据库

集成测试使用单独的连接配置，在临时 schema 中运行并在结束后清理，不向业务表写入测试数据；未配置时相关测试跳过。

| 变量 | 用途 |
| --- | --- |
| `ATHUB_TEST_DATABASE_URL` | 内容模块的真实 PostgreSQL 集成测试 |
| `OAUTH_TEST_DATABASE_URL`、`CREATPLAT_TEST_DATABASE_URL` | 账户库与创作者库的分库集成测试，需指向两个不同的数据库 |
