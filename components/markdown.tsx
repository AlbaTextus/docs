import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import { CodeHighlighted } from "@/components/ui/code-highlighted"
import { headingId } from "@/lib/content"

export function Markdown({ content }: { content: string }) {
  return <div className="docs-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    h2: ({ children }) => <h2 id={headingId(String(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={headingId(String(children))}>{children}</h3>,
    table: ({ children }) => <div className="docs-table-scroll"><table>{children}</table></div>,
    a: ({ href, children }) => href?.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    pre: ({ children }) => <div className="docs-markdown-code">{children}</div>,
    code: ({ children, className }) => {
      const language = /language-(\w+)/.exec(className ?? "")?.[1]
      const value = String(children).replace(/\n$/, "")
      return language ? <CodeHighlighted lang={language} code={value} showCopyButton /> : <code>{children}</code>
    },
  }}>{content}</ReactMarkdown></div>
}
