import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import { DocsShell } from "@/components/docs-shell"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "ALBATEXTUS 文档", template: "%s · ALBATEXTUS 文档" },
  description: "ALBATEXTUS 项目文档：使用指南、界面组件与 API 参考。",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" suppressHydrationWarning><body><Providers><DocsShell>{children}</DocsShell></Providers></body></html>
}
