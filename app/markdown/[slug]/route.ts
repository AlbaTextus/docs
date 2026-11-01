import { getDocument } from "@/lib/content"
import { navigation } from "@/lib/navigation"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!navigation.some(item => item.slug === slug)) return new Response("Not found", { status: 404 })
  const document = await getDocument(slug)
  if (!document) return new Response("Not found", { status: 404 })
  const download = new URL(request.url).searchParams.get("download") === "1"
  return new Response(`# ${document.title}\n\n${document.description}\n\n${document.endpoint ? `\`${document.endpoint.method} ${document.endpoint.path}\`\n\n` : ""}${document.markdown}\n`, { headers: {
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${slug}.md"`,
    "X-Content-Type-Options": "nosniff",
  } })
}
