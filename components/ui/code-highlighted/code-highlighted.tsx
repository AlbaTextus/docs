"use client"

import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "cn"
import { IconButton } from "../icon-button"
import { ShikiContext, ShikiProvider, useShikiHighlighter } from "./provider"
import { defaultCodeLabels } from "./language"
import type { CodeHighlightedProps } from "./types"

export function CodeHighlighted({ code, lang, variant = "default", showLineNumbers = false, highlightLines, showCopyButton = false, labels, className }: CodeHighlightedProps) {
  const { highlight, isLoading, error, labels: providerLabels } = useShikiHighlighter()
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyLabels = { copy: labels?.copy ?? providerLabels.copy ?? defaultCodeLabels.copy, copied: labels?.copied ?? providerLabels.copied ?? defaultCodeLabels.copied, copyError: labels?.copyError ?? providerLabels.copyError ?? defaultCodeLabels.copyError }
  const lineKey = [...new Set(highlightLines)].filter(line => Number.isInteger(line) && line > 0).sort((a, b) => a - b).join(",")
  const html = useMemo(() => highlight(code, lang, { showLineNumbers, highlightLines: lineKey ? lineKey.split(",").map(Number) : [] }), [highlight, code, lang, showLineNumbers, lineKey])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => { setStatus("idle") }, [code])
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setStatus("copied")
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setStatus("idle"), 1800)
    } catch { setStatus("error") }
  }
  return <div className={cn("atui-code", className)} data-variant={variant} data-highlighted={Boolean(html)} data-state={error ? "error" : isLoading ? "loading" : "ready"}>
    {showCopyButton && <div className="atui-code-toolbar"><span>示例代码</span><IconButton label={status === "copied" ? copyLabels.copied : copyLabels.copy} onClick={copy}>{status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</IconButton></div>}
    {html ? <div className="atui-code-content" dangerouslySetInnerHTML={{ __html: html }} /> : <div className="atui-code-content"><pre tabIndex={0} aria-label="代码示例"><code>{code.split("\n").map((line, index, lines) => <span key={index}><span className={cn("line", highlightLines?.includes(index + 1) && "atui-code-line-highlighted")}>{showLineNumbers && <span className="atui-code-line-number" aria-hidden="true">{index + 1}</span>}{line}</span>{index < lines.length - 1 ? "\n" : ""}</span>)}</code></pre></div>}
    <span className="sr-only" role="status">{status === "copied" ? copyLabels.copied : ""}</span>
    {status === "error" && <p className="atui-code-error" role="status">{copyLabels.copyError}</p>}
  </div>
}

/** Markdown can reuse the app provider or load highlighting only for fenced blocks. */
export function StandaloneCodeHighlighted(props: CodeHighlightedProps) {
  const inherited = useContext(ShikiContext)
  return inherited ? <CodeHighlighted {...props} /> : <ShikiProvider engine="javascript" languages={[props.lang]}><CodeHighlighted {...props} /></ShikiProvider>
}
