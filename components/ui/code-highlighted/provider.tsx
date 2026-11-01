"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { HighlighterCore } from "shiki/core"
import { defaultCodeLabels, normalizeLanguage } from "./language"
import type { HighlightOptions, ShikiProviderProps, UseShikiHighlighterResult } from "./types"
import type { renderHighlightedCode } from "./highlighter"

type HighlighterState = { key: string; highlighter: HighlighterCore | null; render: typeof renderHighlightedCode | null; error: Error | null }
type ContextValue = HighlighterState & { isLoading: boolean; labels: typeof defaultCodeLabels }
export const ShikiContext = createContext<ContextValue | null>(null)

export function ShikiProvider({ engine, languages, labels, children }: ShikiProviderProps) {
  const languageKey = [...new Set(languages.map(normalizeLanguage))].sort().join(",")
  const key = `${engine}:${languageKey}`
  const [state, setState] = useState<HighlighterState>({ key: "", highlighter: null, render: null, error: null })
  useEffect(() => {
    let cancelled = false
    let owned: HighlighterCore | null = null
    setState({ key, highlighter: null, render: null, error: null })
    async function initialize() {
      try {
        const { createHighlighter, renderHighlightedCode } = await import("./highlighter")
        const highlighter = await createHighlighter(engine, languageKey ? languageKey.split(",") : [])
        if (cancelled) { highlighter.dispose(); return }
        owned = highlighter
        setState({ key, highlighter, render: renderHighlightedCode, error: null })
      } catch (cause) {
        if (!cancelled) setState({ key, highlighter: null, render: null, error: cause instanceof Error ? cause : new Error("代码高亮加载失败") })
      }
    }
    void initialize()
    return () => { cancelled = true; owned?.dispose() }
  }, [engine, languageKey, key])

  // A changed configuration must never expose the previous, disposed instance.
  const current = state.key === key ? state : { key, highlighter: null, render: null, error: null }
  const mergedLabels = useMemo(() => ({ copy: labels?.copy ?? defaultCodeLabels.copy, copied: labels?.copied ?? defaultCodeLabels.copied, copyError: labels?.copyError ?? defaultCodeLabels.copyError }), [labels?.copy, labels?.copied, labels?.copyError])
  return <ShikiContext.Provider value={{ ...current, isLoading: !current.highlighter && !current.error, labels: mergedLabels }}>{children}</ShikiContext.Provider>
}

export function useShikiHighlighter(): UseShikiHighlighterResult {
  const context = useContext(ShikiContext)
  if (!context) throw new Error("代码高亮需要放在 ShikiProvider 内，请从 @/components/ui/code-highlighted 引入。")
  const { highlighter, render, isLoading, error, labels } = context
  const highlight = useCallback((code: string, lang: string, options?: HighlightOptions) => {
    if (!highlighter || !render) return null
    try { return render(highlighter, code, lang, options) } catch { return null }
  }, [highlighter, render])
  return { highlight, isLoading, isReady: Boolean(highlighter), error, labels }
}
