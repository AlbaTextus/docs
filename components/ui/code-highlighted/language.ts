const aliases: Record<string, string> = {
  js: "javascript", cjs: "javascript", mjs: "javascript", ts: "typescript", cts: "typescript", mts: "typescript",
  sh: "shellscript", bash: "shellscript", shell: "shellscript", zsh: "shellscript", yml: "yaml", py: "python", md: "markdown", gql: "graphql",
  txt: "text", plaintext: "text", plain: "text",
}

export function normalizeLanguage(language: string) {
  const normalized = language.trim().toLowerCase()
  return Object.hasOwn(aliases, normalized) ? aliases[normalized] : normalized || "text"
}

export const defaultCodeLabels = { copy: "复制代码", copied: "已复制", copyError: "复制失败，请手动选择代码。" }
