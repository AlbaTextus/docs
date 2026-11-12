"use client"

import { useEffect, useRef, type CSSProperties, type RefObject } from "react"
import { ArrowRight, BookOpen, ChevronRight, CornerDownRight, CornerDownLeft, FileText, Folder, FolderOpen, ListTree, MousePointer2, X } from "lucide-react"
import { ExecutionTimeline } from "./ui/execution-timeline"
import { ATHUB_API_URL } from "../lib/api"

type Playback = {
  ref: RefObject<HTMLElement | null>
  reduced: boolean
  paused: boolean
  running: boolean
  tick: number
  toggle: () => void
}

const viewBoxes = {
  checkmark: "0 0 24 24",
  todo: "0 0 21 20",
}

function ReferenceIcon({ name, className }: { name: keyof typeof viewBoxes; className?: string }) {
  return <svg className={className} viewBox={viewBoxes[name]} aria-hidden="true"><use href={`/cf-reference/icons.svg#${name}`} /></svg>
}

function ScanBoxIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-box" aria-hidden="true">
    <path d="M12 12v5.5" />
    <path d="M17 3h2a2 2 0 012 2v2" />
    <path d="M21 17v2a2 2 0 01-2 2h-2" />
    <path d="M3 7V5a2 2 0 012-2h2" />
    <path d="M7 21H5a2 2 0 01-2-2v-2" />
    <path d="M7.264 9.252 12 12l4.737-2.748" />
    <path d="M7.995 8.514A2 2 0 007 10.244v3.516a2 2 0 00.996 1.73l3 1.74a2 2 0 002.008 0l3-1.74A2 2 0 0017 13.76v-3.517a2 2 0 00-.995-1.73l-3-1.742a2 2 0 00-1.892-.064z" />
  </svg>
}

const requestExamples = [
  { method: "GET", path: "/api/v2/toc", status: 200 },
  { method: "POST", path: "/api/v2/upload", status: 201 },
  { method: "GET", path: "/api/v2/content", status: 401 },
  { method: "GET", path: "/api/v2/volumes", status: 500 },
  { method: "GET", path: "/api/v2/platforms", status: 200 },
  { method: "POST", path: "/api/v2/authors", status: 201 },
  { method: "GET", path: "/api/v2/novelinfo", status: 404 },
  { method: "PUT", path: "/api/v2/volumes", status: 200 },
  { method: "PUT", path: "/api/v2/content", status: 400 },
  { method: "POST", path: "/api/v2/novelinfo", status: 201 },
  { method: "DELETE", path: "/api/v2/content", status: 204 },
]

const responseExamples = [
  { id: 1, name: "示例平台", url: "https://example.com" },
  { id: 2, name: "小说书库", url: "https://example.org" },
  { id: 3, name: "创作社区", url: "https://example.net" },
]

const chapterExamples = [
  { title: "序章", size: "5.6" },
  { title: "远行", size: "8.2" },
  { title: "初遇", size: "6.4" },
  { title: "来信", size: "7.8" },
  { title: "雨夜", size: "9.1" },
  { title: "归途", size: "6.8" },
]

function completedChapters(tick: number) {
  const latest = 3 + Math.floor(tick / 6)
  // Use the same completion time and failure rule as the upload demonstration.
  return Array.from({ length: Math.min(8, latest) }, (_, index) => latest - index)
    .filter(chapter => tick - (chapter - 3) * 6 >= 4 && chapter % 4 !== 0)
    .slice(0, 4).reverse()
}

function directoryPlayback(tick: number) {
  const cycle = Math.floor(tick / 12)
  const phase = tick % 12
  // Keep the tree stable during each click sequence; refresh between sequences.
  const chapters = completedChapters(cycle * 12)
  const volumes = [...new Set(chapters.map(chapter => Math.floor((chapter - 1) / 4)))]
  const volume = volumes[cycle % volumes.length]
  const children = chapters.filter(chapter => Math.floor((chapter - 1) / 4) === volume)
  const selectedChapter = phase >= 11 ? null : phase >= 9 ? children[children.length - 1] : phase >= 5 ? children[0] : null
  return { phase, chapters, volumes, volume, selectedChapter, expanded: phase >= 2 && phase < 11 }
}

function FileTransfer({ chapter }: { chapter: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const overlay = ref.current
    const panel = overlay?.closest<HTMLElement>(".cf-replica")
    const source = panel?.querySelector<HTMLElement>(`.cf-workflow-row[data-chapter="${chapter}"] .cf-workflow-status`)
    const receiver = panel?.querySelector<HTMLElement>("[data-wall-entry]")
    if (!overlay || !panel || !source || !receiver) return
    function position() {
      if (!overlay || !panel || !source || !receiver) return
      const bounds = panel.getBoundingClientRect()
      // Convert viewport coordinates back to local coordinates, including homepage zoom.
      const scale = bounds.width / panel.offsetWidth
      const start = source.getBoundingClientRect()
      const end = receiver.getBoundingClientRect()
      const x = (start.right - 10 * scale - bounds.left) / scale
      const y = (start.top + start.height / 2 - bounds.top) / scale
      const targetX = (end.left + end.width / 2 - bounds.left) / scale
      const targetY = (end.top + end.height / 2 - bounds.top) / scale
      overlay.style.setProperty("--file-path", `path('M ${x} ${y} C ${x} ${y + 110}, ${targetX} ${targetY - 90}, ${targetX} ${targetY}')`)
      overlay.dataset.ready = "true"
    }
    let frame = 0
    function follow() { position(); frame = requestAnimationFrame(follow) }
    follow()
    const observer = new ResizeObserver(position)
    observer.observe(panel)
    observer.observe(receiver)
    window.addEventListener("resize", position)
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", position) }
  }, [chapter])

  return <div ref={ref} className="cf-file-transfer" data-chapter={chapter} aria-hidden="true">
    <span className="cf-file-packet"><FileText size={22} strokeWidth={1.5} /></span>
  </div>
}

function ChapterReceiver({ chapter, receiving, running }: { chapter?: number; receiving: boolean; running: boolean }) {
  return <section className="cf-panel cf-security" aria-label="章节接收器">
    <ExecutionTimeline className="cf-chapter-wall" rows={9} running={running} incomingChapter={chapter} receiving={receiving} />
  </section>
}

function NovelDirectory({ tick, demo }: { tick: number; demo: ReturnType<typeof directoryPlayback> }) {
  const { chapters, volumes, volume: activeVolume, expanded, selectedChapter, phase } = demo
  const rows = volumes.flatMap(volume => [
    { key: `volume-${volume}`, kind: "volume", id: volume },
    ...chapters.filter(chapter => expanded && volume === activeVolume && Math.floor((chapter - 1) / 4) === volume)
      .map(chapter => ({ key: `chapter-${chapter}`, kind: "chapter", id: chapter })),
  ])
  const targetChapter = phase >= 8 ? chapters.filter(chapter => Math.floor((chapter - 1) / 4) === activeVolume).at(-1) : chapters.find(chapter => Math.floor((chapter - 1) / 4) === activeVolume)
  const targetIndex = rows.findIndex(row => phase < 3 || phase >= 11 ? row.kind === "volume" && row.id === activeVolume : row.kind === "chapter" && row.id === targetChapter)

  return <section className="cf-panel cf-network" aria-label="小说目录">
    <div className="cf-directory-heading"><ListTree size={20} strokeWidth={1.6} aria-hidden="true" /><h3>小说目录</h3></div>
    <div className="cf-directory-tree" role="img" aria-label="自动演示：点击展开卷，依次选中章节，再收起卷。仅展示上传成功的示例章节。" data-phase={phase}>
      <div className="cf-directory-root" aria-hidden="true"><BookOpen size={18} strokeWidth={1.6} /><span>小说 XX</span></div>
      <div className="cf-directory-rows" aria-hidden="true">
        {rows.map((row, index) => <div key={row.key} className="cf-directory-row" data-kind={row.kind} data-chapter={row.kind === "chapter" ? row.id : undefined}
          data-new={row.kind === "chapter" && tick - (row.id - 3) * 6 < 10}
          data-selected={row.kind === "chapter" && row.id === selectedChapter}
          data-expanded={row.kind === "volume" && row.id === activeVolume && expanded}
          style={{ "--tree-index": index } as CSSProperties}>
          {row.kind === "volume" ? <><ChevronRight className="cf-directory-chevron" size={13} />{row.id === activeVolume && expanded ? <FolderOpen size={16} strokeWidth={1.6} /> : <Folder size={16} strokeWidth={1.6} />}</> : <FileText size={15} strokeWidth={1.5} />}
          <span>{row.kind === "volume" ? "第 XX 卷 · XX" : "第 XX 章 · XX"}</span>
        </div>)}
        <span className="cf-directory-cursor" style={{ "--cursor-row": Math.max(0, targetIndex) } as CSSProperties}>
          {[1, 4, 8, 11].includes(phase) && <i key={`${tick}-click`} />}
          <MousePointer2 size={19} fill="white" strokeWidth={1.6} />
        </span>
      </div>
    </div>
  </section>
}

function ResponsePanel({ tick }: { tick: number }) {
  const generation = Math.floor(tick / 8)
  const response = JSON.stringify([responseExamples[generation % responseExamples.length]], null, 2)
  const header = tick % 8 < 4
    ? ["Content-Type", "application/json"]
    : ["Content-Length", String(new TextEncoder().encode(response).length)]

  return <div className="cf-response-stage" role="group" aria-label="GET /api/v2/platforms 的 200 响应示例，非实时数据">
    <div className="cf-response-card">
    <div className="cf-response-heading"><span className="cf-agent-count"><i />响应数据</span><span className="cf-request-status" data-kind="success">200</span></div>
    <pre key={generation}><code>{response.split("\n").map((line, lineIndex, lines) => <span className="cf-response-line" key={lineIndex} style={{ "--line-index": lineIndex } as CSSProperties}>{line.split(/("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b\d+\b)/g).map((token, index) => <span key={index} className={token.endsWith(":") ? "cf-code-url" : token.startsWith('"') ? "cf-code-string" : /^\d+$/.test(token) ? "cf-code-option" : "cf-code-punctuation"}>{token}</span>)}{lineIndex < lines.length - 1 ? "\n" : ""}</span>)}</code></pre>
    </div>
    <div className="cf-response-headers" aria-label="响应头示例">
      <div className="cf-agent-count"><i />响应头</div>
      <dl key={`${generation}-${header[0]}`}><dt>{header[0]}</dt><dd>{header[1]}</dd></dl>
    </div>
  </div>
}

function AgentPanel({ tick }: { tick: number }) {
  const generation = Math.floor(tick / 6)
  const rows = Array.from({ length: Math.min(4, generation + 3) }, (_, index) => generation + 2 - index)
  return <div className="cf-agent-stage" aria-hidden="true">
    <div className="cf-agent-card">
      <div className="cf-agent-count"><i />请求状态</div>
      <div className="cf-agent-list cf-request-list">
        {rows.map((id, index) => {
          const request = requestExamples[id % requestExamples.length]
          return <div className="cf-agent-row cf-request-row" key={id} data-request={id} data-status={request.status} style={{ "--agent-index": index } as CSSProperties}>
            <CornerDownRight className="cf-agent-branch" size={16} />
            <code className="cf-agent-name cf-request-endpoint"><span className="cf-code-command">{request.method}</span>{" "}<span className="cf-code-url">{request.path}</span></code>
            <ArrowRight className="cf-agent-arrow" size={16} />
            <span className="cf-request-status" data-kind={request.status < 300 ? "success" : request.status < 500 ? "client-error" : "server-error"}>{request.status}</span>
          </div>
        })}
      </div>
      <div className="cf-agent-loading"><span className="cf-pixel-loader">{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ "--pixel": index } as CSSProperties} />)}</span></div>
    </div>
    <div className="cf-agent-band" />
    <div className="cf-agent-terminal">
      <div className="cf-terminal-prompt"><span>&gt;</span><code><span className="cf-code-command">curl</span>{" "}<span className="cf-code-url">{ATHUB_API_URL}/api/v2/platforms</span>{" "}<span className="cf-code-punctuation">{"\\"}</span>{"\n  "}<span className="cf-code-option">-H</span>{" "}<span className="cf-code-string">{'"Authorization: Bearer '}<span className="cf-code-variable">$ATHUB_API_TOKEN</span>{'"'}</span><i /></code></div>
      <span className="cf-terminal-enter">Enter<span><CornerDownLeft size={16} /></span></span>
    </div>
  </div>
}

export function ATHubReference({ playback }: { playback: Playback }) {
  const tick = playback.reduced ? 4 : playback.tick
  const directoryDemo = directoryPlayback(playback.reduced ? 6 : tick)
  const transferChapter = 3 + Math.floor((tick - 4) / 6)
  const transferAge = tick - ((transferChapter - 3) * 6 + 4)
  const transferring = !playback.reduced && tick >= 4 && transferChapter % 4 !== 0 && transferAge < 5
  const receiving = transferring && transferAge >= 3
  const generation = Math.floor(tick / 6)
  const latest = 3 + generation
  const records = Array.from({ length: Math.min(5, 3 + generation) }, (_, index) => {
    const chapter = latest - index
    const age = tick - (chapter - 3) * 6
    const phase = playback.reduced ? (index === 0 ? 1 : 2) : Math.min(2, Math.floor(age / 2))
    const state = phase === 2 && chapter % 4 === 0 ? 3 : phase
    return { chapter, state, ...chapterExamples[(chapter - 1) % chapterExamples.length] }
  })

  return <article ref={playback.ref} id="athub" className="cf-replica" data-service="athub" data-running={playback.running} data-tick={tick} aria-label="ATHub 区域：Cloudflare 参考模组还原稿，展示的是示例动画，不代表 ATHub 的实际功能或运行状态">
    <button className="cf-replica-pause" type="button" onClick={playback.toggle} disabled={playback.reduced} aria-pressed={playback.paused}>{playback.paused ? "播放" : "暂停"} ATHub 参考动画</button>
    {['tl', 'tr', 'bl', 'br'].map(corner => <span key={corner} className="cf-replica-corner" data-corner={corner} aria-hidden="true" />)}
    <section className="cf-panel cf-workflow">
      <div className="cf-workflow-heading">
        <div className="cf-workflow-brand" aria-hidden="true">
          <span className="cf-workflow-brand-tile"><ScanBoxIcon /></span>
          {["tl", "tr", "bl", "br"].map(corner => <i key={corner} className="cf-workflow-brand-handle" data-corner={corner} />)}
        </div>
        <div className="cf-workflow-copy"><h3>ATHUB</h3></div>
      </div>
      <div className="cf-workflow-art" role="img" aria-label="章节上传示例动画：每三秒加入一章，从准备中、正在发送变为发送完成或发送失败，不执行真实上传">
        <div className="cf-workflow-list" aria-hidden="true">
          {records.map((record, index) => <div key={record.chapter} className="cf-workflow-row" data-chapter={record.chapter} data-state={record.state} style={{ "--record-index": index } as CSSProperties}>
            <span className="cf-workflow-title">第 XX 章 · XX</span><span className="cf-workflow-time">正文 · {record.size} KB</span>
            <span className="cf-workflow-status">{["准备中", "正在发送", "发送完成", "发送失败"][record.state]}
              {record.state === 1 ? <span className="cf-workflow-spinner" /> : record.state === 3 ? <X className="cf-workflow-check" aria-hidden="true" /> : <ReferenceIcon name={record.state === 2 ? "checkmark" : "todo"} className={record.state === 2 ? "cf-workflow-check" : "cf-workflow-queued"} />}
            </span>
          </div>)}
        </div>
      </div>
    </section>
    <NovelDirectory tick={playback.reduced ? 0 : tick} demo={directoryDemo} />
    <ChapterReceiver chapter={transferring ? transferChapter : undefined} receiving={receiving} running={playback.running} />
    <section className="cf-panel cf-ai">
      <ResponsePanel tick={playback.reduced ? 0 : tick} />
      <AgentPanel tick={playback.reduced ? 0 : tick} />
    </section>
    {transferring && <FileTransfer key={transferChapter} chapter={transferChapter} />}
  </article>
}
