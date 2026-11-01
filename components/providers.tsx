"use client"

import { ThemeProvider } from "@/components/ui/theme-provider"
import { ShikiProvider } from "@/components/ui/code-highlighted"

const languages = ["bash", "json", "javascript", "python", "powershell"]

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider><ShikiProvider engine="javascript" languages={languages} labels={{ copy: "复制代码", copied: "已复制", copyError: "复制失败，请手动复制" }}>{children}</ShikiProvider></ThemeProvider>
}
