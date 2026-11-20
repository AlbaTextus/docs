# 迁移与升级

## 建库与升级

1. 在已有 PG 实例中新建空 image 库及专用账号，设置连接和文件目录。备份并复用 `CLIENT_SECRET_ENCRYPTION_KEY`，不要生成新密钥覆盖。
2. 执行 `npm run db:deploy` 应用账户库迁移（图床外部 Key 的表在账户库），执行 `npm run db:image:deploy` 应用图床库迁移。启动程序不会自动改表。
3. 启动统一 Go 后端，检查旧图、新上传、各模块健康、session 撤销。旧公开入口可将 `/file/` 反代到聚合端口 `8010`，不再为旧端口启动后端监听。

## 从 SQLite 图床导入（已退役）

原 Node 图床的 SQLite 数据由一次性的导入工具迁入：以只读事务逐行归档原五张表并用既有密钥加密，写入文件元数据，保留文件 ID、JSON 整数精度和 S3 键，把 API Key 转为账户库里的哈希，并核对本地文件的 SHA-256。导入完成后，这套工具已经移除：

- 导入命令 `npm run db:image:import` 和发布包中的 `atnexus-migrate-image` 不再提供，`IMAGE_LEGACY_SQLITE` 不再读取。
- 图床库迁移 `20261120000000_drop_import_archive` 删除导入留下的加密归档表 `image_legacy_rows` 与导入标记表 `image_imports`；账户库迁移 `20261120000000_drop_retired_tables` 删除 Key 的导入标记表 `image_key_imports`。
- 归档里的原始行随之永久删除，包括完整的原设置、旧 session、旧 KV 索引与任务记录。文件记录、当前设置、分块会话和已导入的 Key 不受影响。

这两个迁移删除的数据不可恢复，执行前先备份，见[数据库与迁移](/deploy/database)。仍需要从 SQLite 导入时，先用带导入工具的旧版本完成导入与核对，再升级到当前版本。

## 本地迁移验收记录

切换到单端口前的记录：文件 15 条、设置归档 21 条、旧索引操作归档 10 条、Key 1 个；其他两张旧表为空。15 张旧图在当时的新入口和原 8082 入口逐一核对 SHA-256，全部一致。原 `imgbed/data` 保留，停写备份位置记录于 `temp/image-cutover-backup.json`。真实数据和秘密不进入版本库。
