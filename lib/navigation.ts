export type Method = "GET" | "POST" | "PUT" | "DELETE"
export type Endpoint = {
  slug: string
  title: string
  group: string
  method: Method
  path: string
  description: string
  sections: string[]
  requestSection?: string
  responseSection?: string
  responseIsList?: boolean
  status: string
}

export type ServiceId = "athub" | "oauth" | "image" | "creatplat" | "deploy"
export type PageIcon = "book" | "key" | "layers" | "question" | "code" | "checklist" | "server" | "layout" | "plug"
  | "fingerprint" | "mail" | "wrench" | "braces" | "settings" | "drive" | "lifebuoy" | "review" | "database"
  | "network" | "terminal" | "variable" | "container" | "package" | "globe" | "folders"
// `file` is a Markdown document under content/; pages without it are cut from the ATHub API document.
export type Page = { slug: string; title: string; description: string; icon: PageIcon; file?: string }
export type Section = { label: string; pages: Page[] }
export type Service = {
  id: ServiceId
  name: string
  repository: { label: string; href: string }
  feedback: string
  // The first section sits above the API reference in the sidebar, the others below it.
  sections: Section[]
  endpoints: Endpoint[]
}

export const endpoints: Endpoint[] = [
  { slug: "platforms-list", title: "获取平台", group: "平台", method: "GET", path: "/api/v5/platforms", description: "获取平台列表，或通过 ID 查询一个平台。", sections: ["3.1"], responseSection: "3.2", responseIsList: true, status: "200" },
  { slug: "platforms-create", title: "创建平台", group: "平台", method: "POST", path: "/api/v5/platforms", description: "创建一个内容来源平台，返回生成的平台 ID。", sections: ["3.2"], requestSection: "3.2", responseSection: "3.2", status: "201" },
  { slug: "authors-list", title: "获取作者", group: "作者", method: "GET", path: "/api/v5/authors", description: "获取作者 ID、所属平台和姓名，支持按平台筛选。", sections: ["4.1"], responseSection: "4.2", responseIsList: true, status: "200" },
  { slug: "authors-create", title: "创建作者", group: "作者", method: "POST", path: "/api/v5/authors", description: "为已有平台创建作者，可选填写姓名。", sections: ["4.2"], requestSection: "4.2", responseSection: "4.2", status: "201" },
  { slug: "authors-update", title: "修改作者姓名", group: "作者", method: "PUT", path: "/api/v5/authors?id=2", description: "修改或清空作者姓名，保留作者 ID 和所属平台。", sections: ["4.3"], requestSection: "4.3", responseSection: "4.3", status: "200" },
  { slug: "tags-list", title: "获取标签", group: "标签库", method: "GET", path: "/api/v5/tags", description: "获取独立标签库，或通过 ID 查询一个标签。", sections: ["11.1"], responseSection: "11.2", responseIsList: true, status: "200" },
  { slug: "tags-create", title: "创建标签", group: "标签库", method: "POST", path: "/api/v5/tags", description: "创建名称唯一的标签，供多部小说共同引用。", sections: ["11.2"], requestSection: "11.2", responseSection: "11.2", status: "201" },
  { slug: "tags-update", title: "修改标签", group: "标签库", method: "PUT", path: "/api/v5/tags?id=3", description: "修改标签名称，已有小说继续引用同一个标签 ID。", sections: ["11.3"], requestSection: "11.2", responseSection: "11.2", status: "200" },
  { slug: "tags-delete", title: "删除标签", group: "标签库", method: "DELETE", path: "/api/v5/tags?id=3", description: "删除未被引用的标签；仍被小说引用时返回 409。", sections: ["11.4"], status: "204" },
  { slug: "novels-list", title: "获取小说", group: "小说元信息", method: "GET", path: "/api/v5/novelinfo", description: "获取小说元信息，支持平台、作者、标签筛选与分页。", sections: ["5.1"], responseSection: "5.4", responseIsList: true, status: "200" },
  { slug: "novels-create", title: "创建小说", group: "小说元信息", method: "POST", path: "/api/v5/novelinfo", description: "创建小说元信息。导入正文请使用批量上传接口。", sections: ["5.2", "5.4"], requestSection: "5.2", responseSection: "5.4", status: "201" },
  { slug: "novels-update", title: "覆盖小说元信息", group: "小说元信息", method: "PUT", path: "/api/v5/novelinfo?id=10", description: "完整替换小说元信息，不是局部更新。", sections: ["5.3", "5.4"], requestSection: "5.2", responseSection: "5.4", status: "200" },
  { slug: "novels-delete", title: "删除小说", group: "小说元信息", method: "DELETE", path: "/api/v5/novelinfo?id=10", description: "永久删除小说，以及它的全部卷和章节。", sections: ["5.5"], status: "204" },
  { slug: "volumes-list", title: "获取卷", group: "卷与章节", method: "GET", path: "/api/v5/volumes?novelId=10", description: "读取小说的卷列表，或按卷序号获取单个卷。", sections: ["6.1"], responseSection: "6.2", responseIsList: true, status: "200" },
  { slug: "volumes-upsert", title: "上传一个卷", group: "卷与章节", method: "PUT", path: "/api/v5/volumes", description: "按小说 ID 和卷序号创建或覆盖卷标题。", sections: ["6.2"], requestSection: "6.2", responseSection: "6.2", status: "200" },
  { slug: "volumes-delete", title: "删除空卷", group: "卷与章节", method: "DELETE", path: "/api/v5/volumes?novelId=10&order=1", description: "删除一个空卷。仍被章节引用的卷不能删除。", sections: ["6.3"], status: "204" },
  { slug: "toc", title: "获取全书目录", group: "卷与章节", method: "GET", path: "/api/v5/toc?novelId=10", description: "一次获取全部卷与章节目录，不分页、不包含正文。", sections: ["7.4"], responseSection: "7.4", status: "200" },
  { slug: "chapters-list", title: "获取章节正文", group: "卷与章节", method: "GET", path: "/api/v5/content?novelId=10", description: "分页读取章节与完整正文，或查询单个章节。", sections: ["7.1"], responseSection: "7.2", responseIsList: true, status: "200" },
  { slug: "chapters-upsert", title: "上传一个章节", group: "卷与章节", method: "PUT", path: "/api/v5/content", description: "按全书章节序号创建或覆盖标题、正文与卷关联。", sections: ["7.2"], requestSection: "7.2", responseSection: "7.2", status: "200" },
  { slug: "chapters-delete", title: "删除章节", group: "卷与章节", method: "DELETE", path: "/api/v5/content?novelId=10&order=1", description: "删除单个章节，不重新编号其他章节。", sections: ["7.3"], status: "204" },
  { slug: "upload", title: "批量上传小说", group: "数据导入", method: "POST", path: "/api/v5/upload", description: "一次创建小说并导入卷与章节，或为已有小说分批续传。", sections: ["8"], requestSection: "8.1", responseSection: "8.6", status: "201 / 200" },
]

const atnexus = {
  repository: { label: "atnexus 仓库", href: "https://github.com/AlbaTextus/atnexus" },
  feedback: "https://github.com/AlbaTextus/atnexus/issues/new",
}

export const services: Service[] = [
  {
    id: "athub", name: "ATHub",
    repository: { label: "ATHub 仓库", href: "https://github.com/AlbaTextus/athub" },
    feedback: "https://github.com/AlbaTextus/athub/issues/new",
    endpoints,
    sections: [
      { label: "开始使用", pages: [
        { slug: "overview", title: "介绍与快速开始", description: "了解 ATHub，发起你的第一个请求。", icon: "book" },
        { slug: "authentication", title: "鉴权与通用约定", description: "服务地址、Bearer Token、请求格式与安全约定。", icon: "key" },
        { slug: "pagination", title: "分页与数据读取", description: "使用 limit 与 offset 分页读取数据。", icon: "layers" },
      ] },
      { label: "资源", pages: [
        { slug: "errors", title: "错误与状态码", description: "根据 HTTP 状态码处理 API 错误。", icon: "question" },
        { slug: "examples", title: "完整调用示例", description: "从零创建平台、导入小说与分页读取的 PowerShell 示例。", icon: "code" },
        { slug: "novel-import", title: "小说拆解与上传规范", description: "把 TXT、EPUB 整理为元信息、卷和章节，并通过 API 导入。", icon: "checklist", file: "athub/NOVEL_IMPORT.md" },
      ] },
      { label: "模块维护", pages: [
        { slug: "module", title: "模块与数据库", description: "ATHub 在统一服务中的入口、鉴权方式、读缓存与内容库迁移。", icon: "server", file: "athub/module.md" },
        { slug: "library-web", title: "小说库前端", description: "小说库页面的入口、数据来源与缓存方式。", icon: "layout", file: "athub/library-web.md" },
      ] },
    ],
  },
  {
    id: "oauth", name: "OAuth", ...atnexus, endpoints: [],
    sections: [
      { label: "开始使用", pages: [
        { slug: "overview", title: "模块概览", description: "账户与授权模块的职责、路由、凭据和源码结构。", icon: "book", file: "oauth/overview.md" },
        { slug: "integration", title: "应用接入", description: "登记客户端，完成授权码流程、刷新、撤销与自省。", icon: "plug", file: "oauth/integration.md" },
      ] },
      { label: "账户", pages: [
        { slug: "login", title: "登录与账户", description: "登录流程、第三方登录、头像、Turnstile、页面与账户等级。", icon: "fingerprint", file: "oauth/login.md" },
        { slug: "email", title: "邮箱认证", description: "SMTP 配置、验证码规则与邮箱绑定接口。", icon: "mail", file: "oauth/email.md" },
        { slug: "athub-key", title: "ATHub 密钥与权限", description: "个人 Key、调用记录、管理员禁用与等级权限。", icon: "key", file: "oauth/athub-key.md" },
      ] },
      { label: "管理与参考", pages: [
        { slug: "site", title: "站点开关与维护", description: "功能开关、维护模式与消息功能下线迁移。", icon: "wrench", file: "oauth/site.md" },
        { slug: "api", title: "接口一览", description: "OAuth、认证、个人账户与管理接口的路径表。", icon: "braces", file: "oauth/api.md" },
      ] },
    ],
  },
  {
    id: "image", name: "图床", ...atnexus, endpoints: [],
    sections: [
      { label: "开始使用", pages: [
        { slug: "overview", title: "模块概览", description: "图床模块的职责、认证方式与接口。", icon: "book", file: "image/overview.md" },
        { slug: "config", title: "配置", description: "图床的环境变量与默认值。", icon: "settings", file: "image/config.md" },
      ] },
      { label: "运维", pages: [
        { slug: "migration", title: "迁移与升级", description: "从原 SQLite 图床迁移到独立 PostgreSQL 的步骤。", icon: "drive", file: "image/migration.md" },
        { slug: "recovery", title: "兼容边界与失败恢复", description: "不再兼容的旧入口，以及上传、删除、移动失败后的处理。", icon: "lifebuoy", file: "image/recovery.md" },
      ] },
    ],
  },
  {
    id: "creatplat", name: "创作者平台", ...atnexus, endpoints: [],
    sections: [
      { label: "开始使用", pages: [
        { slug: "overview", title: "模块概览", description: "投稿、审核、修订与贡献历史模块的职责和边界。", icon: "book", file: "creatplat/overview.md" },
        { slug: "workflow", title: "投稿、编辑与审核", description: "页面入口、审核流程、作品资料编辑与插图布局。", icon: "review", file: "creatplat/workflow.md" },
      ] },
      { label: "参考", pages: [
        { slug: "api", title: "接口一览", description: "创作者平台 /api/v4 的接口、鉴权与请求约定。", icon: "braces", file: "creatplat/api.md" },
        { slug: "database", title: "独立数据库", description: "创作者库的数据归属、建库、旧数据迁移与回退限制。", icon: "database", file: "creatplat/database.md" },
      ] },
    ],
  },
  {
    id: "deploy", name: "部署", ...atnexus, endpoints: [],
    sections: [
      { label: "开始使用", pages: [
        { slug: "overview", title: "服务总览", description: "atnexus 的模块、端口、功能和部署顺序。", icon: "network", file: "deploy/overview.md" },
        { slug: "local", title: "本地快速开始", description: "准备环境、初始化数据库并在本地启动服务。", icon: "terminal", file: "deploy/local.md" },
      ] },
      { label: "配置", pages: [
        { slug: "environment", title: "环境变量", description: "Go 服务与前端使用的环境变量。", icon: "variable", file: "deploy/environment.md" },
        { slug: "database", title: "数据库与迁移", description: "四套数据库的建立、迁移命令与升级步骤。", icon: "database", file: "deploy/database.md" },
      ] },
      { label: "发布", pages: [
        { slug: "docker", title: "Docker Compose", description: "用 Compose 启动数据库、后端与前端。", icon: "container", file: "deploy/docker.md" },
        { slug: "build", title: "构建与发布", description: "本地构建，以及生成 Linux AMD64 发布包。", icon: "package", file: "deploy/build.md" },
        { slug: "production", title: "生产部署与升级", description: "入口与域名、健康检查、密钥备份和升级清单。", icon: "globe", file: "deploy/production.md" },
      ] },
      { label: "开发", pages: [
        { slug: "development", title: "开发与目录约定", description: "目录结构、常用命令、前端命名规范与 UI 维护。", icon: "folders", file: "deploy/development.md" },
      ] },
    ],
  },
]

export const apiFile = "athub/API.md"
export const groups = [...new Set(endpoints.map(endpoint => endpoint.group))]
export const docHref = (slug: string, service: ServiceId = "athub") => `/${service}/${slug}`
export const serviceHome = (service: Service) => docHref(service.sections[0].pages[0].slug, service.id)

// Reading order of one service: opening section, API reference, remaining sections.
export function pagesOf(service: Service): (Page | Endpoint)[] {
  return [...service.sections[0].pages, ...service.endpoints, ...service.sections.slice(1).flatMap(section => section.pages)]
}

export function findPage(serviceId: string, slug: string) {
  const service = services.find(item => item.id === serviceId)
  const page = service && pagesOf(service).find(item => item.slug === slug)
  if (!service || !page) return null
  const endpoint = "method" in page ? page : undefined
  const section = service.sections.find(item => item.pages.some(entry => entry === page))
  return { service, page, endpoint, section }
}

export function serviceFromPath(pathname: string) {
  return services.find(service => pathname.startsWith(`/${service.id}/`)) ?? services[0]
}
