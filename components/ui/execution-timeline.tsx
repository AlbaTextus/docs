"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { FileText } from "lucide-react"
import styles from "./execution-timeline.module.css"

export type TimelineSegment = {
  id: string
  kind: "paid" | "free"
  label: string
  weight: number
  durationSeconds?: number
}

const referenceSegments: readonly TimelineSegment[] = [
  { id: "chapters", kind: "free", label: "章节流动墙", weight: 1, durationSeconds: 60 },
]

/** Reference composition: widths are illustrative weights, not a linear duration scale. */
export function ExecutionTimeline({ segments = referenceSegments, className = "", rows = 3, running, incomingChapter, receiving = false }: {
  segments?: readonly TimelineSegment[]
  className?: string
  rows?: number
  running?: boolean
  incomingChapter?: number
  receiving?: boolean
}) {
  const frame = useRef<HTMLElement>(null)
  const target = useRef<HTMLElement | null>(null)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (incomingChapter === undefined || !frame.current) return
    target.current?.removeAttribute("data-wall-entry")
    const pattern = frame.current.querySelector<HTMLElement>(`[data-wall-row="${Math.floor(rows / 2)}"]`)?.parentElement
    if (!pattern) return
    const bounds = pattern.getBoundingClientRect()
    const slots = [...pattern.querySelectorAll<HTMLElement>(`[data-wall-row="${Math.floor(rows / 2)}"] [data-wall-slot]`)]
    const visible = slots.filter(slot => { const r = slot.getBoundingClientRect(); return r.left >= bounds.left + 12 && r.right <= bounds.right - 12 })
    target.current = visible.sort((a, b) => Math.abs(a.getBoundingClientRect().left - (bounds.left + bounds.width / 2)) - Math.abs(b.getBoundingClientRect().left - (bounds.left + bounds.width / 2)))[0] ?? null
    target.current?.setAttribute("data-wall-entry", "true")
    target.current?.removeAttribute("data-arrived")
  }, [incomingChapter, rows])
  useEffect(() => {
    if (receiving) target.current?.setAttribute("data-arrived", "true")
  }, [receiving, incomingChapter])
  return <figure ref={frame} className={`${styles.frame} ${className}`} data-paused={paused || running === false} aria-label="章节文件插入流动墙的动画示例">
    {running === undefined && <button className={styles.pause} type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? "播放动画" : "暂停动画"}</button>}
    {["tl", "tr", "bl", "br"].map(corner => <i key={corner} className={styles.handle} data-corner={corner} aria-hidden="true" />)}
    <div className={styles.track} data-wall-track>
      {segments.map(segment => <div key={segment.id} className={styles.segment} data-kind={segment.kind}
        style={{ flexGrow: segment.weight, "--scroll-duration": `${segment.durationSeconds ?? 60}s` } as CSSProperties}>
        <div className={styles.bar}>
          {segment.kind === "free" && <div className={styles.pattern} aria-hidden="true">
            {Array.from({ length: rows }, (_, row) => <div className={styles.marquee} data-wall-row={row} key={row}>
              {[0, 1].map(copy => <div className={styles.repeat} key={copy}>{Array.from({ length: 12 }, (_, index) => <span key={index} data-wall-slot className={styles.chapterSlot} style={{ "--insert-delay": `${-(index * 1.7 + row * 2.3)}s` } as CSSProperties}><FileText className={styles.chapterIcon} strokeWidth={1.6} /></span>)}</div>)}
            </div>)}
          </div>}
        </div>
      </div>)}
    </div>
  </figure>
}
