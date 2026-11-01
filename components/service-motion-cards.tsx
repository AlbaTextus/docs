"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { useInView } from "framer-motion"
import { ArrowUpRight, Pause, Play } from "lucide-react"
import { IconButton } from "./ui/icon-button"
import { ATHubReference } from "./athub-reference"
import { OAuthFlow } from "./oauth-flow"

const subscribeMotion = (notify: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)")
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify)
  return () => document.removeEventListener("visibilitychange", notify)
}
const getVisible = () => document.visibilityState === "visible"
const serverReducedMotion = () => true
const serverVisible = () => false

function usePlayback(intervalMs = 1000) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: .15 })
  const reduced = useSyncExternalStore(subscribeMotion, getReducedMotion, serverReducedMotion)
  const visible = useSyncExternalStore(subscribeVisibility, getVisible, serverVisible)
  const [paused, setPaused] = useState(false)
  const [tick, setTick] = useState(0)
  const running = inView && visible && !reduced && !paused
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setTick(value => value + 1), intervalMs)
    return () => window.clearInterval(timer)
  }, [running, intervalMs])
  return { ref, reduced, paused, running, tick: reduced ? 9 : tick, toggle: () => setPaused(value => !value) }
}

function ModuleFrame({ service, title, description, href, linkLabel, external, children, playback }: {
  service: "oauth" | "athub"; title: string; description: string; href: string; linkLabel: string; external?: boolean; children: ReactNode; playback: ReturnType<typeof usePlayback>
}) {
  return <article ref={playback.ref} className="service-module" data-service={service} data-running={playback.running} data-tick={playback.tick} aria-labelledby={`service-${service}-title`}>
    <div className="service-module-corners" aria-hidden="true">
      {["tl", "tr", "bl", "br"].map(corner => <span key={corner} className="cf-replica-corner" data-corner={corner} />)}
    </div>
    <header className="service-module-header">
      <div className="service-module-copy">
        <h2 id={`service-${service}-title`}>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="service-module-actions">
        <IconButton label={`${playback.paused ? "播放" : "暂停"} ${title} 动画`} size="icon-sm" onClick={playback.toggle} disabled={playback.reduced} aria-pressed={playback.paused}>
          {playback.paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </IconButton>
        <IconButton label={linkLabel} role="link" nativeButton={false} render={external ? <a href={href} target="_blank" rel="noopener noreferrer" /> : <Link href={href} />}>
          <ArrowUpRight aria-hidden="true" />
        </IconButton>
      </div>
    </header>
    <div className="service-module-grid">{children}</div>
  </article>
}

function OAuthModule() {
  const playback = usePlayback(500)
  return <ModuleFrame service="oauth" title="OAuth" description="统一登录与授权，只分享你明确允许的信息。" href="https://github.com/AlbaTextus/oauth" external linkLabel="查看 OAuth 源码（新窗口）" playback={playback}>
    <OAuthFlow playback={playback} />
  </ModuleFrame>
}

function ATHubModule() {
  const playback = usePlayback(500)
  return <ATHubReference playback={playback} />
}

export function ServiceMotionCards() {
  return <div className="service-motion"><OAuthModule /><ATHubModule /></div>
}
