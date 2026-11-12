import { readFile } from "node:fs/promises"
import path from "node:path"

export const sourcePath = () => path.resolve(process.cwd(), "content/athub/API.md")

export const getContentSource = () => readFile(sourcePath(), "utf8")
