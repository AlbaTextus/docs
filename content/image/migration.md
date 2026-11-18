# 迁移与升级

1. 在已有 PG 实例中新建空 image 库及专用账号，设置连接和原文件路径。备份并复用 `CLIENT_SECRET_ENCRYPTION_KEY`，不要生成新密钥覆盖。
2. 执行 `npm run db:deploy` 创建 OAuth 图床 Key 表，执行 `npm run db:image:deploy` 创建独立图床表。启动程序不会自动改表。
3. 停止原 Node 图床及其他 SQLite 写入方，完整备份 SQLite、WAL/SHM、文件目录，限制备份访问。
4. 执行 `npm run db:image:import -- -source <SQLite绝对路径>`，或 `atnexus-migrate-image -source <路径>`。
5. 工具使用只读 SQLite 事务逐行归档原五张表，以既有密钥加密。保留文件 ID、JSON 整数精度和 S3 键。旧 session、KV 索引与任务只归档，不生效；API Key 转为 OAuth 哈希。
6. 解密核对归档及写入的文件元数据，将本地字节 SHA-256 纳入源摘要。非空目标、变化的源快照、缺失文件、未知历史存储渠道均拒绝覆盖。
7. 重复执行验证同一摘要并返回 `alreadyImported=true`。两库非原子事务：OAuth 有独立导入标记，支持图床提交失败后重试，不重新启用后来被撤销的 Key。
8. 启动统一 Go 后端，检查旧图、新上传、各模块健康、session 撤销。旧公开入口可将 `/file/` 反代到聚合端口 `8010`，不再为旧端口启动后端监听。

本地迁移验收记录（切换到单端口前）：文件 15 条、设置归档 21 条、旧索引操作归档 10 条、Key 1 个；其他两张旧表为空。15 张旧图在当时的新入口和原 8082 入口逐一核对 SHA-256，全部一致。原 `imgbed/data` 保留，停写备份位置记录于 `temp/image-cutover-backup.json`。真实数据和秘密不进入版本库。
