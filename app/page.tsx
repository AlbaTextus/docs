import { Braces } from "lucide-react"
import { DocsHero } from "@/components/docs-hero"
import { DocumentCard } from "@/components/ui/document-card"
import { docHref } from "@/lib/navigation"

export default function Page() {
  return <div className="docs-hub">
    <DocsHero />
    <section className="docs-hub-directory" aria-labelledby="docs-directory-title">
      <h2 id="docs-directory-title">找到你需要的文档</h2>
      <div className="docs-hub-directory-grid">
        <DocumentCard href={docHref("overview")} title="如何调用 ATHub" description="了解鉴权、接口参数与完整调用示例。" icon={Braces} />
      </div>
    </section>
  </div>
}
