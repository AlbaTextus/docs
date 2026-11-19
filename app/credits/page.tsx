import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const description = "文档站用到的开源字体，以及 Cloudflare 提供的服务与组件。"

export const metadata: Metadata = { title: "致谢", description }

const external = { target: "_blank", rel: "noopener noreferrer" }

export default function CreditsPage() {
  return <div className="docs-page docs-page-guide">
    <div className="docs-breadcrumb"><Link href="/">文档</Link><ChevronRight size={12} /><span>致谢</span></div>
    <header className="docs-page-heading"><h1>致谢</h1><p>{description}</p></header>
    <article className="docs-article docs-markdown docs-credits">
      <h2>开源字体</h2>
      <p>正文与代码使用 <a href="https://github.com/subframe7536/maple-font" {...external}>Maple Mono</a> 及其中文版 Maple Mono CN，© 2022 The Maple Mono Project Authors，以 <a href="https://openfontlicense.org" {...external}>SIL Open Font License 1.1</a> 授权。</p>
      <h2>Cloudflare</h2>
      <p>文档站部署在 <a href="https://workers.cloudflare.com/" {...external}>Cloudflare Workers</a> 上，侧栏使用 Cloudflare 开源的 <a href="https://github.com/cloudflare/kumo" {...external}>Kumo</a> 组件库（MIT 许可）。</p>
    </article>
  </div>
}
