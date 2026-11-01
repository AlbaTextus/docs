import { readFile } from "node:fs/promises"
import path from "node:path"
import { ATHUB_API_URL } from "./api"
import { endpoints, navigation, type Endpoint } from "./navigation"

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

export const sourcePath = () => path.resolve(process.cwd(), "content/athub/API.md")
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

export function buildDocument(slug: string, source: string): Document | null {
  const item = navigation.find(item => item.slug === slug)
  if (!item) return null
  const sections = splitSections(source)
  const endpoint = endpoints.find(item => item.slug === slug)
  let markdown = ""
  if (endpoint) {
    markdown = endpoint.sections.map(key => sections.get(key) ?? "").join("\n\n")
  } else if (slug === "overview") {
    markdown = `ATHub 是 ALBATEXTUS 的统一内容存储中枢。通过一套 REST API，管理平台、作者、小说、卷和章节。

## 开始之前

ATHub 服务地址为 \`${ATHUB_API_URL}\`。以下所有接口统一使用此地址，且必须携带 \`Authorization: Bearer <API_TOKEN>\` 请求头。

调用前请在服务端环境变量中配置 \`API_TOKEN\`，使用 ATHub Go 服务的服务密钥，而不是 OAuth access token。

> 服务密钥拥有全库读写权限。请仅在服务端或采集程序中使用，切勿放入网页或公开客户端。文档站不会代发 API 请求或保存你的密钥。

## 发起第一个请求

\`\`\`bash
curl --request GET '${ATHUB_API_URL}/platforms' \\
  --header "Authorization: Bearer $API_TOKEN"
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
    markdown = `${common.slice(common.indexOf("### 通用分页参数"))}\n\n## 分页读取章节\n\n${sections.get("11.4")}\n\n> 章节返回完整正文。建议按需设置 limit，不提供无上限的全量正文接口。只需要卷与章节标题时，使用[获取全书目录](/athub/toc)：一次返回完整目录，不分页、不传输正文。`
  } else if (slug === "errors") markdown = sections.get("10") ?? ""
  else if (slug === "examples") markdown = sections.get("11") ?? ""

  const requests = jsonBlocks(sections.get(endpoint?.requestSection ?? "") ?? "")
  const responses = jsonBlocks(sections.get(endpoint?.responseSection ?? "") ?? "")
  // Request and response examples stay sourced from the API document, not copied schemas.
  return { slug, title: item.title, description: item.description, markdown,
    endpoint, request: requests[0] ?? null, response: responses.at(-1) ?? null }
}

export async function getDocument(slug: string) {
  return buildDocument(slug, await readFile(sourcePath(), "utf8"))
}

export function getHeadings(markdown: string): Heading[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "")
  return [...withoutCode.matchAll(/^#{2,3} (.+)$/gm)].map(match => ({ id: headingId(match[1]), text: match[1].replace(/^\d+(?:\.\d+)*\.?\s*/, "") }))
}
