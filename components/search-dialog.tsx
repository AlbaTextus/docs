"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowDown, ArrowUp, CornerDownLeft, Search } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/primitives/dialog"
import { docHref, pagesOf, serviceFromPath, services } from "@/lib/navigation"
import { pageIcons } from "./doc-icons"

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const current = serviceFromPath(usePathname()).id
  const results = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/)
    // Every service is searchable; the one being read comes first.
    return [...services].sort((a, b) => Number(b.id === current) - Number(a.id === current))
      .flatMap(service => pagesOf(service).map(item => ({ item, service, href: docHref(item.slug, service.id) })))
      .filter(({ item, service }) => terms.every(term => `${service.name} ${item.title} ${item.description} ${"path" in item ? `${item.path} ${item.method}` : ""}`.toLowerCase().includes(term)))
  }, [query, current])
  useEffect(() => {
    if (open) document.querySelector(".docs-search-results > a[data-selected]")?.scrollIntoView({ block: "nearest" })
  }, [open, selected])
  function navigate(href: string) { onOpenChange(false); router.push(href) }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="docs-search-dialog" showCloseButton={false}>
    <DialogTitle className="sr-only">搜索文档</DialogTitle><DialogDescription className="sr-only">搜索标题、说明、HTTP 方法或接口路径。使用上下方向键选择，回车打开。</DialogDescription>
    <div className="docs-search-input"><Search size={20} /><input aria-label="搜索标题、接口或方法" placeholder="搜索文档、接口或方法..." value={query} onChange={event => { setQuery(event.target.value); setSelected(0) }} onKeyDown={event => {
      if (event.key === "ArrowDown") { event.preventDefault(); setSelected(value => Math.max(0, Math.min(value + 1, results.length - 1))) }
      if (event.key === "ArrowUp") { event.preventDefault(); setSelected(value => Math.max(value - 1, 0)) }
      if (event.key === "Enter" && results[selected]) { event.preventDefault(); navigate(results[selected].href) }
    }} /><button onClick={() => onOpenChange(false)} aria-label="关闭搜索"><kbd>Esc</kbd></button></div>
    <div className="docs-search-results" aria-label="搜索结果"><p className="docs-search-caption">{query ? `${results.length} 个搜索结果` : "浏览文档"}</p>{results.length ? results.map(({ item, service, href }, index) => {
      const Icon = "icon" in item ? pageIcons[item.icon] : null
      return <Link href={href} key={href} data-selected={selected === index || undefined} onMouseEnter={() => setSelected(index)} onClick={() => onOpenChange(false)}><span className="docs-search-result-icon">{"method" in item ? <span className={`method-text method-${item.method.toLowerCase()}`}>{item.method}</span> : Icon && <Icon size={17} />}</span><span><strong>{item.title}</strong><small>{"path" in item ? item.path : `${service.name} · ${item.description}`}</small></span><CornerDownLeft size={14} /></Link>
    }) : <div className="docs-search-empty"><Search size={28} /><strong>没有找到相关文档</strong><p>试试“上传”、GET 或 /content。</p></div>}</div>
    <div className="docs-search-hint"><span><ArrowUp size={12} /><ArrowDown size={12} />选择</span><span><CornerDownLeft size={12} />打开</span><span>Ctrl / ⌘ K</span></div>
  </DialogContent></Dialog>
}
