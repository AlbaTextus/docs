import type { ReactNode } from "react"

export type ShikiEngine = "javascript" | "wasm"
export type CodeHighlightedLabels = { copy?: string; copied?: string; copyError?: string }
export type HighlightOptions = { highlightLines?: readonly number[]; showLineNumbers?: boolean }
export type ShikiProviderProps = {
  engine: ShikiEngine
  languages: readonly string[]
  labels?: CodeHighlightedLabels
  children: ReactNode
}
export type CodeHighlightedProps = HighlightOptions & {
  code: string
  lang: string
  variant?: "default" | "plain"
  showCopyButton?: boolean
  labels?: CodeHighlightedLabels
  className?: string
}
export type UseShikiHighlighterResult = {
  highlight: (code: string, lang: string, options?: HighlightOptions) => string | null
  isLoading: boolean
  isReady: boolean
  error: Error | null
  labels: CodeHighlightedLabels
}
