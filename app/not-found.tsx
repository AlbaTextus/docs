import Link from "next/link"

export default function NotFound() {
  return <div className="docs-not-found"><h1>文档未找到</h1><p>文档可能已移动，试试搜索，或回到文档首页。</p><Link href="/">返回文档首页 →</Link></div>
}
