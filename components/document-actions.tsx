"use client"

import { useRef, useState, useEffect } from "react"
import { Check, ChevronDown, Copy, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"

export function DocumentActions({ markdown, slug }: { markdown: string; slug: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  async function copy() {
    try { await navigator.clipboard.writeText(markdown); setStatus("copied") }
    catch { setStatus("error") }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus("idle"), 2400)
  }
  return <div className="docs-document-actions"><Button variant="outline" size="sm" onClick={() => void copy()}>{status === "copied" ? <Check size={14} /> : <Copy size={14} />}<span aria-live="polite">{status === "copied" ? "已复制" : status === "error" ? "复制失败，请下载" : "复制 Markdown"}</span></Button><details className="docs-open-menu"><summary>打开 <ChevronDown size={13} /></summary><div><a href={`/markdown/${slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />查看 Markdown</a><a href={`/markdown/${slug}?download=1`} download={`${slug}.md`}><Download size={14} />下载文档</a><a href="https://github.com/AlbaTextus/athub" target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />ATHub 仓库</a></div></details></div>
}
