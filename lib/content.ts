import { getContentSource } from "@/lib/content-source"
import { ATHUB_API_URL } from "./api"
import { apiFile, findPage, type Endpoint } from "./navigation"

export type Heading = { id: string; text: string }
export type Document = {
  slug: string
  title: string
  description: string
  markdown: string
  endpoint?: Endpoint
  request: string | null
  response: string | null
}

export { sourcePath } from "@/lib/content-source"
export const headingId = (text: string) => text.replace(/^\d+(?:\.\d+)*\.?\s*/, "").replace(/[`*]/g, "").trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase()

export function splitSections(markdown: string) {
  const sections = new Map<string, string>()
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const starts: { key: string; depth: number; line: number }[] = []
  let fenced = false
  lines.forEach((line, index) => {
    if (line.startsWith("```")) fenced = !fenced
    if (fenced) return
    const match = /^(#{2,3}) (\d+(?:\.\d+)*)\.?\s/.exec(line)
    if (match) starts.push({ key: match[2], depth: match[1].length, line: index })
  })
  starts.forEach((start, index) => {
    const end = starts.slice(index + 1).find(next => next.depth <= start.depth)?.line ?? lines.length
    sections.set(start.key, lines.slice(start.line + 1, end).join("\n").trim())
  })
  return sections
}

function jsonBlocks(markdown: string) {
  return [...markdown.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map(match => match[1].trim())
}

// `source` is the page's own Markdown file, or the ATHub API document for pages cut from it.
export function buildDocument(service: string, slug: string, source: string): Document | null {
  const located = findPage(service, slug)
  if (!located) return null
  const { page: item, endpoint } = located
  if ("file" in item && item.file) {
    // The page heading already shows the title, so the document's own H1 is dropped.
    const markdown = source.replace(/\r\n/g, "\n").replace(/^# .+\n+/, "").trim()
    return { slug, title: item.title, description: item.description, markdown, request: null, response: null }
  }
  const sections = splitSections(source)
  let markdown = ""
  if (endpoint) {
    markdown = endpoint.sections.map(key => sections.get(key) ?? "").join("\n\n")
  } else if (slug === "overview") {
    markdown = `ATHub 是 ALBATEXTUS 统一服务的 v5 内容模块。通过一套 REST API，管理平台、作者、标签库、小说、卷和章节。封面文件上传与插图由[创作者平台](/creatplat/api)的 \`/api/v4\` 提供。

## 开始之前

ATHub 服务地址为 \`${ATHUB_API_URL}\`。以下所有接口统一使用此地址，且必须携带 \`Authorization: Bearer <ATHUB_API_TOKEN>\` 请求头。

先登录账户，在 \`POST /api/v1/account/key\` 创建自己的 ATHub Key。创建时只返回一次明文，将它保存到调用端的 \`ATHUB_API_TOKEN\` 环境变量。内容接口使用 \`/api/v5/\`，账户接口使用 \`/api/v1/\`。两者共用后端的聚合端口（自托管默认 \`8010\`），数据库分别配置。

> 个人 Key 目前可读写共享内容库，不按用户隔离小说。请仅在服务端或采集程序中使用，切勿放入网页或公开客户端。Key 和调用记录保存在账户库；文档站不会代发 API 请求或保存你的密钥。

## 发起第一个请求

\`\`\`bash
curl --request GET '${ATHUB_API_URL}/api/v5/platforms' \\
  --header "Authorization: Bearer $ATHUB_API_TOKEN"
\`\`\`

成功返回平台数组；没有平台时返回 \`[]\`。接下来可先[创建平台](/athub/platforms-create)，再[批量上传小说](/athub/upload)。

## 接口一览

${sections.get("2")}

## 推荐阅读

- [鉴权与通用约定](/athub/authentication)：确认服务地址、请求格式和大小限制。
- [批量上传小说](/athub/upload)：一次导入元信息、卷和章节。
- [获取全书目录](/athub/toc)：一次读取卷与章节标题，不传输正文。
- [完整调用示例](/athub/examples)：运行从零导入和分批续传示例。`
  } else if (slug === "authentication") markdown = sections.get("1") ?? ""
  else if (slug === "pagination") {
    const common = sections.get("1") ?? ""
    markdown = `${common.slice(common.indexOf("### 通用分页参数"))}\n\n## 分页读取章节\n\n${sections.get("10.4")}\n\n> 章节返回完整正文。建议按需设置 limit，不提供无上限的全量正文接口。只需要卷与章节标题时，使用[获取全书目录](/athub/toc)：一次返回完整目录，不分页、不传输正文。`
  } else if (slug === "errors") markdown = sections.get("9") ?? ""
  else if (slug === "examples") markdown = sections.get("10") ?? ""

  const requests = jsonBlocks(sections.get(endpoint?.requestSection ?? "") ?? "")
  const responses = jsonBlocks(sections.get(endpoint?.responseSection ?? "") ?? "")
  // Request and response examples stay sourced from the API document, not copied schemas.
  return { slug, title: item.title, description: item.description, markdown,
    endpoint, request: requests[0] ?? null, response: responses.at(-1) ?? null }
}

export const documentFile = (service: string, slug: string) => {
  const page = findPage(service, slug)?.page
  return page && "file" in page && page.file ? page.file : apiFile
}

export async function getDocument(service: string, slug: string) {
  if (!findPage(service, slug)) return null
  return buildDocument(service, slug, await getContentSource(documentFile(service, slug)))
}

// The Markdown offered for copying and download: page heading, endpoint line, then the body.
export function exportMarkdown(document: Document) {
  const { endpoint } = document
  return `# ${document.title}\n\n${document.description}\n\n${endpoint ? `\`${endpoint.method} ${endpoint.path}\`\n\n` : ""}${document.markdown}`
}

export function getHeadings(markdown: string): Heading[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "")
  return [...withoutCode.matchAll(/^#{2,3} (.+)$/gm)].map(match => ({ id: headingId(match[1]), text: match[1].replace(/^\d+(?:\.\d+)*\.?\s*/, "") }))
}
