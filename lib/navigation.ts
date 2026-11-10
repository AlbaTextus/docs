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

export const guides = [
  { slug: "overview", title: "介绍与快速开始", description: "了解 ATHub，发起你的第一个请求。" },
  { slug: "authentication", title: "鉴权与通用约定", description: "服务地址、Bearer Token、请求格式与安全约定。" },
  { slug: "pagination", title: "分页与数据读取", description: "使用 limit 与 offset 分页读取数据。" },
] as const

export const endpoints: Endpoint[] = [
  { slug: "platforms-list", title: "获取平台", group: "平台", method: "GET", path: "/api/v2/platforms", description: "获取平台列表，或通过 ID 查询一个平台。", sections: ["3.1"], responseSection: "3.2", responseIsList: true, status: "200" },
  { slug: "platforms-create", title: "创建平台", group: "平台", method: "POST", path: "/api/v2/platforms", description: "创建一个内容来源平台，返回生成的平台 ID。", sections: ["3.2"], requestSection: "3.2", responseSection: "3.2", status: "201" },
  { slug: "authors-list", title: "获取作者", group: "作者", method: "GET", path: "/api/v2/authors", description: "获取作者标识列表，支持按平台筛选。", sections: ["4.1"], responseSection: "4.2", responseIsList: true, status: "200" },
  { slug: "authors-create", title: "创建作者", group: "作者", method: "POST", path: "/api/v2/authors", description: "为已有平台创建一个作者标识。", sections: ["4.2"], requestSection: "4.2", responseSection: "4.2", status: "201" },
  { slug: "novels-list", title: "获取小说", group: "小说元信息", method: "GET", path: "/api/v2/novelinfo", description: "获取小说元信息，支持平台、作者筛选与分页。", sections: ["5.1"], responseSection: "5.4", responseIsList: true, status: "200" },
  { slug: "novels-create", title: "创建小说", group: "小说元信息", method: "POST", path: "/api/v2/novelinfo", description: "创建小说元信息。导入正文请使用批量上传接口。", sections: ["5.2", "5.4"], requestSection: "5.2", responseSection: "5.4", status: "201" },
  { slug: "novels-update", title: "覆盖小说元信息", group: "小说元信息", method: "PUT", path: "/api/v2/novelinfo?id=10", description: "完整替换小说元信息，不是局部更新。", sections: ["5.3", "5.4"], requestSection: "5.2", responseSection: "5.4", status: "200" },
  { slug: "novels-delete", title: "删除小说", group: "小说元信息", method: "DELETE", path: "/api/v2/novelinfo?id=10", description: "永久删除小说，以及它的全部卷和章节。", sections: ["5.5"], status: "204" },
  { slug: "volumes-list", title: "获取卷", group: "卷与章节", method: "GET", path: "/api/v2/volumes?novelId=10", description: "读取小说的卷列表，或按卷序号获取单个卷。", sections: ["6.1"], responseSection: "6.2", responseIsList: true, status: "200" },
  { slug: "volumes-upsert", title: "上传一个卷", group: "卷与章节", method: "PUT", path: "/api/v2/volumes", description: "按小说 ID 和卷序号创建或覆盖卷标题。", sections: ["6.2"], requestSection: "6.2", responseSection: "6.2", status: "200" },
  { slug: "volumes-delete", title: "删除空卷", group: "卷与章节", method: "DELETE", path: "/api/v2/volumes?novelId=10&order=1", description: "删除一个空卷。仍被章节引用的卷不能删除。", sections: ["6.3"], status: "204" },
  { slug: "toc", title: "获取全书目录", group: "卷与章节", method: "GET", path: "/api/v2/toc?novelId=10", description: "一次获取全部卷与章节目录，不分页、不包含正文。", sections: ["7.4"], responseSection: "7.4", status: "200" },
  { slug: "chapters-list", title: "获取章节正文", group: "卷与章节", method: "GET", path: "/api/v2/content?novelId=10", description: "分页读取章节与完整正文，或查询单个章节。", sections: ["7.1"], responseSection: "7.2", responseIsList: true, status: "200" },
  { slug: "chapters-upsert", title: "上传一个章节", group: "卷与章节", method: "PUT", path: "/api/v2/content", description: "按全书章节序号创建或覆盖标题、正文与卷关联。", sections: ["7.2"], requestSection: "7.2", responseSection: "7.2", status: "200" },
  { slug: "chapters-delete", title: "删除章节", group: "卷与章节", method: "DELETE", path: "/api/v2/content?novelId=10&order=1", description: "删除单个章节，不重新编号其他章节。", sections: ["7.3"], status: "204" },
  { slug: "upload", title: "批量上传小说", group: "数据导入", method: "POST", path: "/api/v2/upload", description: "一次创建小说并导入卷与章节，或为已有小说分批续传。", sections: ["8"], requestSection: "8.1", responseSection: "8.6", status: "201 / 200" },
]

export const references = [
  { slug: "errors", title: "错误与状态码", description: "根据 HTTP 状态码处理 API 错误。" },
  { slug: "examples", title: "完整调用示例", description: "从零创建平台、导入小说与分页读取的 PowerShell 示例。" },
] as const

export const navigation = [...guides, ...endpoints, ...references]
export const groups = [...new Set(endpoints.map(endpoint => endpoint.group))]
export const docHref = (slug: string) => `/athub/${slug}`
