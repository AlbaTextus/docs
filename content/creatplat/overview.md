# 模块概览

本模块负责投稿、审核、修订、贡献历史与相关查询。统一服务通过聚合入口（默认 `8010`，由 `GATEWAY_HTTP_ADDR` 配置）提供 `/api/v4/*`。

**本模块使用独立 PostgreSQL 数据库**，由必填的 `CREATPLAT_DATABASE_URL` 配置，不回退到账户库。建库、迁移、核对与回退步骤见[独立数据库](/creatplat/database)。

页面入口与审核流程见[投稿、编辑与审核](/creatplat/workflow)，接口见[接口一览](/creatplat/api)。

## 与其他模块的关系

正式内容仍由 ATHub 保存，审核通过后调用其私有执行能力。内容回执与内容变更保持原事务语义，贡献历史确认失败保留待核对状态。封面和插图由本模块在同一进程内直接保存到[图床模块](/image/overview)的 `book/covers`、`book/illustrations` 分类，不经 HTTP 和上传 Key。这两个上传接口接受网站登录会话或 ATHub 个人 Key，见[接口一览](/creatplat/api)。

审核、历史和修订写入创作者库；角色权限、session、准入和额度仍由原账户能力接口校验。跨库事务不原子，通过内容回执和历史准备/确认保留原失败处理语义。

## 历史与贡献者

`/api/v4/history?novelId=2&limit=20&offset=0` 返回分页变更历史，
`/api/v4/contributors?novelId=2` 返回真实创建者与后续贡献者。
两个接口使用现有网站 session 或个人 Key 鉴权，浏览器直连后端；Next.js 不代理历史查询。
作品详情的贡献者卡片链接到 `/library/books/2/history`，沿用现有组件、字体和面板。

历史与贡献者查询入口为 `/api/v4/history`、`/api/v4/contributors`。为保留原权限与审计语义，宿主适配器暂将这些请求转换为旧操作标签，再执行原准入事务；外部不再使用该内部标签作为新路径。

审核表 `athub_reviews` 和历史表 `novel_revisions` 由独立创作者库 `CREATPLAT_DATABASE_URL` 管理，迁移链位于 `modules/creatplat/prisma/`。
旧账户库中对应两张表保留为升级导入来源；部署前按 [创作者数据库说明](/creatplat/database) 完成建库、迁移和数据核对。ATHub 小说库不新增历史表或账号表。
修改者由宿主根据已认证的账号或 Key 所属账号确定，客户端不能指定贡献者。
小说元数据、卷、章节、批量上传以及已有作者/标签名称的修改都记录变更；
同一次请求按小说合并为一条记录，无实际变化不新增记录。
章节正文更新时，在服务历史中保存修改片段及少量上下文，按字高亮新增与删除，并标注所在行；
不保存整章初始快照。单章保存与批量上传均记录差异，小说库仍只存当前内容。
旧历史只有摘要哈希、字数及变动标记，无法追溯补出当时的正文差异。
旧数据不补造创建者，后续编辑者只列为贡献者。删除条目后服务库仍保留历史。

跨库写入先在创作者库保存 pending 记录，再提交小说事务，最后确认历史为 completed；
准备记录失败会回滚小说写入。只有 completed 记录用于历史页与贡献统计，
内容提交与历史确认之间发生崩溃或服务库中断时，请求本身仍按成功返回，pending 记录保留，不冒充已完成记录。内容事务会在 ATHub 库的 `RevisionReceipt` 写入同一批次号；后台每 5 分钟核对停留超过 10 分钟的 pending 批次：有回执的改为 completed，没有的改为 failed。回执保留 7 天后清理。上线前应用 ATHub 模块迁移 `20261118000000_revision_receipts`（`npm run db:athub:deploy`），否则服务拒绝启动。

## 源码结构

模块位于 `modules/creatplat/`：

- `api/`：投稿、作品修改、封面/插图提交、审核列表与决策接口。沿用旧资源路径结构，将前缀从 v1 改为 v4。
- `governance.go`：变更入队、审核执行、可信贡献者与幂等执行回执衔接。
- `history.go`：贡献记录准备/确认与历史、贡献者查询。
- `repository/history.go`：历史 SQL 与类型，运行时使用创作者独立连接池。
- `storage/`：独立库初始化、审核存储、迁移核对及旧数据导入。
- `prisma/`：创作者数据库的独立 schema 和迁移链。
