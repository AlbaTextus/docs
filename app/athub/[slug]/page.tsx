import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ChevronRight, Info } from "lucide-react"
import { getDocument, getHeadings } from "@/lib/content"
import { docHref, endpoints, navigation } from "@/lib/navigation"
import { Markdown } from "@/components/markdown"
import { DocumentActions } from "@/components/document-actions"
import { CodeExamples } from "@/components/code-examples"

export function generateStaticParams() { return navigation.map(({ slug }) => ({ slug })) }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const document = navigation.find(item => item.slug === slug)
  return { title: document?.title ?? "文档未找到", description: document?.description }
}

export default async function DocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!navigation.some(item => item.slug === slug)) notFound()
  const document = await getDocument(slug)
  if (!document) notFound()
  const endpoint = document.endpoint
  const headings = getHeadings(document.markdown)
  const index = navigation.findIndex(item => item.slug === slug)
  const previous = navigation[index - 1]
  const next = navigation[index + 1]
  const exportedMarkdown = `# ${document.title}\n\n${document.description}\n\n${endpoint ? `\`${endpoint.method} ${endpoint.path}\`\n\n` : ""}${document.markdown}`
  return <div className={`docs-page ${endpoint ? "docs-page-api" : "docs-page-guide"}`}>
    <div className="docs-breadcrumb"><Link href="/">文档</Link><ChevronRight size={12} /><span>ATHub</span><ChevronRight size={12} /><span>{endpoint ? "API 参考" : "开发指南"}</span>{endpoint && <><ChevronRight size={12} /><span>{endpoint.group}</span></>}</div>
    <header className="docs-page-heading"><div className="docs-page-eyebrow">{endpoint ? "API REFERENCE" : "DEVELOPER GUIDE"}<span /><span>ATHub</span></div><h1>{document.title}</h1><p>{document.description}</p><DocumentActions markdown={exportedMarkdown} slug={slug} /></header>
    <div className="docs-article-layout">
      <article className="docs-article">
        {endpoint && <>
          <section className="docs-endpoint-card" aria-label="接口地址"><div className="docs-endpoint-path"><span className={`docs-method method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span><code>{endpoint.path}</code><span className="docs-rest-badge">REST</span></div>{document.request && <details><summary><span className="docs-json-symbol">{"{ }"}</span>Body<span>application/json</span><ChevronRight size={14} /></summary><Markdown content={`\`\`\`json\n${document.request}\n\`\`\``} /></details>}</section>
          <div className="docs-section-title docs-parameters-heading" id="parameters"><h2>{endpoint.method === "GET" || endpoint.method === "DELETE" ? "Query Parameters" : "Request Body"}</h2><span>{document.request ? "application/json" : "URL query"}</span></div>
        </>}
        {slug === "overview" && <div className="docs-overview-note"><span className="docs-overview-note-icon"><Info size={18} /></span><div><strong>一个中枢，完整的数据链路。</strong><p>平台 → 作者 → 小说 → 卷 → 章节。{endpoints.length} 个接口操作，统一的鉴权和数据格式。</p></div><span>REST API</span></div>}
        <Markdown content={document.markdown} />
        {endpoint && <div className="docs-source-note"><Info size={15} /><span>正文与 JSON 示例读取自 <code>docs/content/athub/API.md</code>，与项目文档保持同源。</span></div>}
        <div className="docs-page-feedback"><span>发现文档有问题？</span><a href="https://github.com/AlbaTextus/athub/issues/new" target="_blank" rel="noopener noreferrer">在 GitHub 提出建议 ↗</a></div>
        <nav className="docs-page-pagination" aria-label="相邻文档">{previous ? <Link href={docHref(previous.slug)}><span><ArrowLeft size={14} />上一篇</span><strong>{previous.title}</strong></Link> : <span />}{next && <Link href={docHref(next.slug)}><span>下一篇<ArrowRight size={14} /></span><strong>{next.title}</strong></Link>}</nav>
      </article>
      {endpoint ? <CodeExamples endpoint={endpoint} request={document.request} response={document.response} /> : <aside className="docs-toc" aria-label="本页目录"><span>本页内容</span>{headings.map(heading => <a key={heading.id} href={`#${heading.id}`}>{heading.text}</a>)}<div className="docs-toc-bottom"><span>开始构建</span><p>准备好导入你的第一本小说了吗？</p><Link href={docHref("upload")}>查看批量上传 <ArrowRight size={13} /></Link></div></aside>}
    </div>
  </div>
}
