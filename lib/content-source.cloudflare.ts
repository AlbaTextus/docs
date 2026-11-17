// Embed every document at build time; Workers have no project filesystem.
const sources = import.meta.glob<string>("../content/**/*.md", { query: "?raw", import: "default", eager: true })

export const sourcePath = (file: string) => `content/${file}`

export const getContentSource = async (file: string) => {
  const source = sources[`../content/${file}`]
  if (source === undefined) throw new Error(`Missing document source: ${file}`)
  return source
}
