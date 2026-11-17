# 投稿、编辑与审核

## 页面入口

创作者平台位于 `/creatplat`，默认进入 `/creatplat/upload` 提交小说，审核中心位于 `/creatplat/reviews`。两页共用可收起的侧栏。入口统一放在书库头像菜单的「创作者平台」中，原书库顶部的提交导航和头像菜单内的审核入口已移除，原 `/library/upload`、`/library/reviews` 路由已删除。

## 审核流程

需审核的内容写入返回 HTTP `202` 以及 `review_id`、`status: "pending"`，此时正式书库尚未变化。LT3、LT4 可在审核中心查看提交并通过或驳回；不能审核自己的提交，也不能借审核执行自己无权进行的操作。通过后应用原提交，保留提交者作为历史贡献者；驳回原因与审核结果会保存。重复或并发审核不会重复写入内容。提交者可通过 `/api/v4/account/athub/submissions` 及 `/{id}` 查询自己的状态和结果，审核接口为 `/api/v4/admin/athub/reviews`。

哪些等级需要审核、哪些操作被禁止，由管理员在账户模块配置，见 [ATHub 密钥与权限](/oauth/athub-key)。

## 作品资料编辑

作品详情「贡献者」标题右侧的红色铅笔进入原位编辑模式，点击可编辑内容即可修改，也可在浏览状态双击内容直接编辑。作品名称、来源平台、关联作者、连载状态、封面链接、简介和标签可编辑；字数、章节数、更新时间和贡献记录保持只读。顶部操作栏统一保存或取消资料修改，需审核时提交后继续展示正式资料。`/admin/settings` 的「接口权限 → 作品资料编辑」可按等级选择继承、允许或禁止，审核要求沿用该等级的「内容写入（含作品资料编辑）需审核后生效」。浏览器通过 `PUT /api/v4/account/athub/novels/{id}` 提交，服务端绑定登录会话及作品编号，复用 `PUT /api/v5/novelinfo` 的权限、审核和变更历史；写入仍执行 session、来源与业务权限检查。

## 插图与布局

编辑模式下，插图面板上方为展示画布，下方为当前作品的图片资源。将资源拖入画布后，拖动图片块内部调整位置，拖动四边或四角调整大小；靠近其他块的边缘时吸附并显示对齐线。移出画布保留图片资源，删除资源则同时清理画布引用。布局可在插图面板单独保存，也随顶部「保存修改」一起提交，取消修改还原未保存布局。浏览状态按已保存布局展示；未设置布局的作品沿用图片列表。

插图资源上传使用 `POST /api/v4/account/athub/novels/{id}/illustrations`，删除使用 `DELETE /api/v4/account/athub/novels/{id}/illustrations/{illustrationId}`；资源操作单独提交，资料编辑的取消不会撤销已经提交的上传或删除。布局通过 `GET /api/v5/illustration-layout?novelId=…` 读取，浏览器以 `PUT /api/v4/account/athub/novels/{id}/illustration-layout` 保存，内部复用 `PUT /api/v5/illustration-layout?novelId=…` 的权限、审核和贡献历史。保存校验作品资源归属与布局版本；旧版本返回 409，避免覆盖他人的调整。待审核资源或布局继续展示正式数据。上线前应用模块迁移 `20261115010000_illustration_layout`。

插图上传的图片格式、尺寸限制和归一化规则见 [ATHub 模块与数据库](/athub/module)。
