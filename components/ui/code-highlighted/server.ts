import { createHighlighter, renderHighlightedCode } from "./highlighter"
import type { HighlightOptions, ShikiEngine } from "./types"

export type CreateServerHighlighterOptions = { languages: readonly string[]; engine?: ShikiEngine }
export type ServerHighlighter = { highlight: (code: string, lang: string, options?: HighlightOptions) => string; dispose: () => void }

export async function createServerHighlighter({ languages, engine = "javascript" }: CreateServerHighlighterOptions): Promise<ServerHighlighter> {
  const highlighter = await createHighlighter(engine, languages)
  let disposed = false
  return {
    highlight(code, lang, options) {
      if (disposed) throw new Error("高亮器已释放，请创建新的实例。")
      return renderHighlightedCode(highlighter, code, lang, options) ?? renderHighlightedCode(highlighter, code, "text", options)!
    },
    dispose() { if (!disposed) { disposed = true; highlighter.dispose() } },
  }
}

export async function highlightCode(code: string, lang: string, options: HighlightOptions & { engine?: ShikiEngine } = {}) {
  const highlighter = await createServerHighlighter({ languages: [lang], engine: options.engine })
  try { return highlighter.highlight(code, lang, options) } finally { highlighter.dispose() }
}
