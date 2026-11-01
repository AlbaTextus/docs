import type { HighlighterCore } from "shiki/core"
import { normalizeLanguage } from "./language"
import type { HighlightOptions, ShikiEngine } from "./types"

export async function createHighlighter(engine: ShikiEngine, languages: readonly string[]) {
  const [{ createHighlighterCore }, { bundledLanguages }, light, dark] = await Promise.all([
    import("shiki/core"), import("shiki/langs"), import("shiki/dist/themes/github-light.mjs"), import("shiki/dist/themes/vesper.mjs"),
  ])
  const requested = [...new Set(languages.map(normalizeLanguage))]
  const available = requested.filter(language => Object.hasOwn(bundledLanguages, language)) as (keyof typeof bundledLanguages)[]
  const grammars = await Promise.all(available.map(async language => (await bundledLanguages[language]()).default))
  const regexEngine = engine === "wasm"
    ? await import("shiki/engine/oniguruma").then(module => module.createOnigurumaEngine(import("shiki/wasm")))
    : await import("shiki/engine/javascript").then(module => module.createJavaScriptRegexEngine({ forgiving: true }))
  return createHighlighterCore({ engine: regexEngine, themes: [light.default, dark.default], langs: grammars })
}

export function renderHighlightedCode(highlighter: HighlighterCore, code: string, language: string, options: HighlightOptions = {}) {
  const lang = normalizeLanguage(language)
  if (lang !== "text" && !highlighter.getLoadedLanguages().includes(lang)) return null
  const emphasized = new Set(options.highlightLines)
  return highlighter.codeToHtml(code, {
    lang, themes: { light: "github-light", dark: "vesper" }, defaultColor: false,
    transformers: [{
      pre(node) {
        node.properties.tabIndex = 0
        node.properties["aria-label"] = "代码示例"
      },
      line(node, line) {
        if (emphasized.has(line)) this.addClassToHast(node, "atui-code-line-highlighted")
        if (options.showLineNumbers) node.children.unshift({
          type: "element", tagName: "span", properties: { className: ["atui-code-line-number"], "aria-hidden": "true" },
          children: [{ type: "text", value: String(line) }],
        })
      },
    }],
  })
}
