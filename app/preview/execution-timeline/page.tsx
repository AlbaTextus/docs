import type { Metadata } from "next"
import { ExecutionTimeline } from "@/components/ui/execution-timeline"

export const metadata: Metadata = { title: "执行耗时时间轴预览", robots: { index: false, follow: false } }

export default function TimelinePreview() {
  return <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "32px 16px", background: "#fff" }}>
    <ExecutionTimeline />
  </main>
}
