import { readFile } from "node:fs/promises"
import path from "node:path"

// `file` always comes from the navigation data, never from a request.
export const sourcePath = (file: string) => path.resolve(process.cwd(), "content", file)

export const getContentSource = (file: string) => readFile(sourcePath(file), "utf8")
