import { exportMarkdown, getDocument } from "@/lib/content"

// /markdown/<service>/<slug>; the older /markdown/<slug> form keeps resolving to ATHub.
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const [service, slug] = path.length === 1 ? ["athub", path[0]] : path
  const document = path.length <= 2 ? await getDocument(service, slug) : null
  if (!document) return new Response("Not found", { status: 404 })
  const download = new URL(request.url).searchParams.get("download") === "1"
  return new Response(`${exportMarkdown(document)}\n`, { headers: {
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${service}-${slug}.md"`,
    "X-Content-Type-Options": "nosniff",
  } })
}
