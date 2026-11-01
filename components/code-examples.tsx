"use client"

import { useState, type ComponentProps } from "react"
import { Check } from "lucide-react"
import { CodeHighlighted as AtuiCode } from "@/components/ui/code-highlighted"
import type { Endpoint } from "@/lib/navigation"
import { languages, requestCode, responseCode, type Language } from "@/lib/code-examples"

function CodeHighlighted(props: ComponentProps<typeof AtuiCode>) {
  return <AtuiCode {...props} showCopyButton />
}

export function CodeExamples({ endpoint, request, response }: { endpoint: Endpoint; request: string | null; response: string | null }) {
  const [language, setLanguage] = useState<Language>("cURL")
  const [responseTab, setResponseTab] = useState<"success" | "error">("success")
  const languageIds = { cURL: "bash", JavaScript: "javascript", Python: "python" }
  const exampleResponse = responseCode(endpoint, response)
  return <aside className="docs-examples" aria-label="请求与响应示例">
    <div className="docs-example-heading"><span><span className="docs-live-dot" />请求示例</span><span>服务端调用</span></div>
    <section className="docs-code-card"><div className="docs-code-tabs" role="tablist" aria-label="示例语言">{languages.map(item => <button key={item} id={`code-tab-${item}`} role="tab" aria-selected={language === item} aria-controls="request-code-panel" tabIndex={language === item ? 0 : -1} onClick={() => setLanguage(item)} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); const next = languages[(languages.indexOf(item) + (event.key === "ArrowRight" ? 1 : 2)) % 3]; setLanguage(next); document.getElementById(`code-tab-${next}`)?.focus() } }}>{item}</button>)}</div><div id="request-code-panel" role="tabpanel" aria-labelledby={`code-tab-${language}`}><CodeHighlighted code={requestCode(endpoint, request, language)} lang={languageIds[language]} /></div></section>
    <section className="docs-code-card docs-response-card"><div className="docs-code-tabs" role="tablist" aria-label="响应示例"><button id="response-success" role="tab" aria-controls="response-code-panel" aria-selected={responseTab === "success"} onClick={() => setResponseTab("success")}><span className="docs-status-dot" />{endpoint.status}<span className="docs-tab-caption">成功</span></button><button id="response-error" role="tab" aria-controls="response-code-panel" aria-selected={responseTab === "error"} onClick={() => setResponseTab("error")}>401<span className="docs-tab-caption">鉴权失败</span></button></div><div id="response-code-panel" role="tabpanel" aria-labelledby={`response-${responseTab}`}>{responseTab === "error" ? <CodeHighlighted lang="json" code={'{\n  "error": "unauthorized"\n}'} /> : exampleResponse ? <CodeHighlighted lang="json" code={exampleResponse} /> : <div className="docs-no-response"><Check size={18} /><span>删除成功，无响应体。</span></div>}</div><div className="docs-code-caption">{responseTab === "success" ? "示例响应 · 字段含义以正文为准" : "错误文字仅为示意，请按 HTTP 状态码处理"}</div></section>
  </aside>
}
