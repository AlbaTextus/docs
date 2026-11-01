"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react"
import { useInView } from "framer-motion"
import { ArrowUpRight, BookOpen, Check, Database, FileText, Fingerprint, Github, KeyRound, Link2, Mail, Pause, Play, ShieldCheck, UserRound } from "lucide-react"
import { IconButton } from "./ui/icon-button"
import { docHref } from "@/lib/navigation"

const motionQuery = "(prefers-reduced-motion: reduce)"
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia(motionQuery)
  media.addEventListener("change", notify)
  return () => media.removeEventListener("change", notify)
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify)
  return () => document.removeEventListener("visibilitychange", notify)
}
const getVisible = () => document.visibilityState === "visible"
const serverReducedMotion = () => true
const serverVisible = () => false
const oauthSteps = ["选择登录方式", "验证身份", "确认授权", "连接应用"]
const athubSteps = ["批量上传", "卷章入库", "读取目录", "获取正文"]

function MotionSteps({ steps, step }: { steps: string[]; step: number }) {
  return <ol className="service-motion-steps" aria-hidden="true">
    {steps.map((label, index) => <li key={label} data-active={index === step} data-complete={index < step}>
      <span className="service-motion-step-track" /><span>{label}</span>
    </li>)}
  </ol>
}

function OAuthAnimation({ id, step }: { id: string; step: number }) {
  return <svg className="service-motion-art oauth-motion-art" viewBox="0 0 560 310" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-ink`} x1="60" y1="70" x2="470" y2="260" gradientUnits="userSpaceOnUse"><stop stopColor="var(--motion-blue)" /><stop offset="1" stopColor="var(--motion-pink)" /></linearGradient>
      <radialGradient id={`${id}-orb`}><stop stopColor="var(--motion-paper)" /><stop offset="1" stopColor="var(--motion-blue-soft)" /></radialGradient>
      <linearGradient id={`${id}-scan`} x2="0" y2="1"><stop stopColor="var(--motion-blue)" stopOpacity="0" /><stop offset="1" stopColor="var(--motion-blue)" stopOpacity=".22" /></linearGradient>
      <clipPath id={`${id}-clip`}><circle cx="273" cy="155" r="65" /></clipPath>
    </defs>
    <g className="motion-orbit" stroke={`url(#${id}-ink)`} opacity=".13">
      {Array.from({ length: 13 }, (_, i) => <ellipse key={i} cx="273" cy="155" rx={92 + i * 6} ry={82 + i * 4.5} transform={`rotate(${-25 + i * 2} 273 155)`} strokeWidth=".65" />)}
    </g>
    <g className="motion-wires" stroke={`url(#${id}-ink)`} strokeWidth="1.2">
      <path d="M104 69H140C164 69 156 125 189 125H208" />
      <path d="M104 155H208" />
      <path d="M104 241H140C164 241 156 185 189 185H208" />
      <path d="M338 155H361C386 155 370 108 399 108H411" />
      <path d="M338 155H361C386 155 370 238 399 238H411" />
    </g>
    <g className="motion-packets" stroke="var(--motion-blue)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="4 210">
      <path d="M104 69H140C164 69 156 125 189 125H208" />
      <path d="M104 155H208" />
      <path d="M104 241H140C164 241 156 185 189 185H208" />
      <path className="motion-outgoing" d="M338 155H361C386 155 370 238 399 238H411" />
    </g>
    {[
      { y: 43, Icon: Mail, label: "邮箱" },
      { y: 129, Icon: Fingerprint, label: "通行密钥" },
      { y: 215, Icon: Github, label: "第三方" },
    ].map(({ y, Icon, label }, index) => <g key={label} className="oauth-login-source" style={{ "--source-index": index } as CSSProperties}>
      <rect x="34" y={y} width="70" height="52" rx="13" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <Icon x="58" y={y + 8} width="22" height="22" stroke="var(--motion-blue)" strokeWidth="1.4" />
      <text x="69" y={y + 43} textAnchor="middle" className="motion-small-label">{label}</text>
    </g>)}
    <circle cx="273" cy="160" r="68" fill="var(--motion-shadow)" opacity=".14" />
    <circle cx="273" cy="155" r="65" fill={`url(#${id}-orb)`} stroke="var(--motion-paper)" strokeWidth="3" />
    <circle className="oauth-verification-ring" cx="273" cy="155" r="70" stroke={`url(#${id}-ink)`} strokeWidth="1.4" strokeDasharray="4 7" />
    <g className="oauth-fingerprint" data-visible={step < 2}>
      <Fingerprint x="230" y="112" width="86" height="86" stroke={`url(#${id}-ink)`} strokeWidth=".85" />
      <g clipPath={`url(#${id}-clip)`}><rect className="oauth-scan" x="208" y="90" width="130" height="48" fill={`url(#${id}-scan)`} /></g>
    </g>
    <g className="oauth-identity" data-visible={step >= 2}>
      <UserRound x="248" y="118" width="50" height="50" stroke="var(--motion-blue)" strokeWidth="1.2" />
      <text x="273" y="192" textAnchor="middle" className="motion-label">身份已验证</text>
    </g>
    <g className="oauth-verified" data-visible={step >= 1}>
      <circle cx="319" cy="200" r="15" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <ShieldCheck x="310" y="191" width="18" height="18" stroke="var(--motion-blue)" strokeWidth="1.6" />
    </g>
    <g className="oauth-consent" data-visible={step >= 2}>
      <rect x="402" y="48" width="132" height="133" rx="12" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <text x="417" y="74" className="motion-label">应用授权</text>
      <path d="M416 86H520" stroke="var(--motion-edge)" />
      <UserRound x="417" y="98" width="14" height="14" stroke="var(--motion-muted)" strokeWidth="1.5" />
      <text x="439" y="109" className="motion-small-label">基本资料</text>
      <Check x="505" y="98" width="14" height="14" stroke="var(--motion-blue)" strokeWidth="1.7" />
      <rect className="oauth-allow-button" x="416" y="134" width="104" height="30" rx="7" fill="var(--motion-blue)" />
      <text x="468" y="153" textAnchor="middle" className="motion-button-label">允许授权</text>
      <path className="oauth-cursor" d="m499 155 3 20 5-6 8 1z" fill="var(--motion-ink)" stroke="var(--motion-paper)" strokeWidth="1.5" />
    </g>
    <g className="oauth-token" data-visible={step === 3}>
      <rect x="403" y="211" width="133" height="54" rx="12" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <KeyRound x="416" y="228" width="20" height="20" stroke="var(--motion-blue)" strokeWidth="1.5" />
      <text x="445" y="234" className="motion-small-label">访问令牌</text>
      <text x="445" y="252" className="motion-code-label">•••• ••••</text>
      <Check x="513" y="230" width="14" height="14" stroke="var(--motion-blue)" strokeWidth="1.7" />
    </g>
  </svg>
}

function ATHubAnimation({ id, step }: { id: string; step: number }) {
  return <svg className="service-motion-art athub-motion-art" viewBox="0 0 560 310" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-pages`} x1="174" y1="100" x2="378" y2="270" gradientUnits="userSpaceOnUse"><stop stopColor="var(--motion-blue)" /><stop offset="1" stopColor="var(--motion-pink)" /></linearGradient>
      <linearGradient id={`${id}-page-fill`} x1="170" y1="120" x2="365" y2="260" gradientUnits="userSpaceOnUse"><stop stopColor="var(--motion-paper)" /><stop offset="1" stopColor="var(--motion-pink-soft)" /></linearGradient>
    </defs>
    <g className="motion-wires" stroke={`url(#${id}-pages)`} strokeWidth="1.2">
      <path d="M98 158H142Q160 158 177 177L211 211" />
      <path d="M365 209L390 184Q401 173 416 173H432" />
    </g>
    <g className="motion-packets" stroke="var(--motion-pink)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="4 210">
      <path d="M98 158H142Q160 158 177 177L211 211" />
      <path d="M365 209L390 184Q401 173 416 173H432" />
    </g>
    <g className="athub-upload" data-active={step === 0}>
      <rect x="36" y="97" width="70" height="100" rx="9" transform="rotate(-13 71 147)" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <rect x="43" y="95" width="70" height="100" rx="9" transform="rotate(8 78 145)" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <rect x="36" y="103" width="70" height="100" rx="9" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <FileText x="49" y="118" width="23" height="23" stroke="var(--motion-pink)" strokeWidth="1.3" />
      <path d="M49 155H90M49 164H83M49 173H89M49 182H72" stroke="var(--motion-edge-strong)" strokeWidth="2" strokeLinecap="round" />
    </g>
    <ellipse cx="279" cy="279" rx="115" ry="9" fill="var(--motion-shadow)" opacity=".09" />
    <g className="athub-book" data-active={step === 1}>
      <path d="M279 268C247 244 200 243 169 224V128C207 145 249 143 279 178C309 143 351 145 389 128V224C358 243 311 244 279 268Z" fill={`url(#${id}-page-fill)`} opacity=".85" />
      <path d="M169 128V229C207 246 249 247 279 273C309 247 351 246 389 229V128" stroke={`url(#${id}-pages)`} strokeWidth="1.6" />
      {Array.from({ length: 25 }, (_, i) => <g key={i} className="athub-book-leaf" style={{ "--leaf-index": i } as CSSProperties} stroke={`url(#${id}-pages)`} strokeWidth=".8" opacity={.28 + i * .021}>
        <path d={`M279 ${267 - i * 1.8}C250 ${240 - i * 3.5} 206 ${244 - i * 3.8} 174 ${223 - i * 3.8}`} />
        <path d={`M279 ${267 - i * 1.8}C308 ${240 - i * 3.5} 352 ${244 - i * 3.8} 384 ${223 - i * 3.8}`} />
      </g>)}
      <path d="M279 180V269" stroke={`url(#${id}-pages)`} strokeWidth="1.4" />
    </g>
    <g className="athub-write-status" data-visible={step >= 1}>
      <rect x="231" y="64" width="97" height="32" rx="16" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <Database x="243" y="73" width="14" height="14" stroke="var(--motion-pink)" strokeWidth="1.4" />
      <text x="267" y="85" className="motion-small-label">事务写入</text>
    </g>
    <g className="athub-directory" data-visible={step >= 1}>
      <rect x="418" y="93" width="119" height="161" rx="12" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <BookOpen x="430" y="108" width="16" height="16" stroke="var(--motion-pink)" strokeWidth="1.4" />
      <text x="453" y="120" className="motion-label">小说</text>
      <path d="M435 137V212M435 149H447M435 181H447M435 212H447" stroke="var(--motion-edge-strong)" />
      <g className="athub-tree-volume" data-active={step === 2}>
        <rect x="446" y="136" width="79" height="26" rx="5" fill="var(--motion-pink-soft)" />
        <text x="456" y="153" className="motion-small-label">第一卷</text>
      </g>
      <g className="athub-tree-chapter" data-active={step === 3}>
        <rect x="446" y="168" width="79" height="26" rx="5" fill="var(--motion-pink-soft)" />
        <FileText x="453" y="175" width="12" height="12" stroke="var(--motion-pink)" strokeWidth="1.5" />
        <text x="472" y="185" className="motion-small-label">第 1 章</text>
      </g>
      <FileText x="453" y="206" width="12" height="12" stroke="var(--motion-muted)" strokeWidth="1.5" />
      <text x="472" y="216" className="motion-small-label">第 2 章</text>
      <path d="M432 237H523" stroke="var(--motion-edge)" />
    </g>
    <g className="athub-readout" data-visible={step === 3}>
      <rect x="328" y="23" width="112" height="67" rx="9" fill="var(--motion-paper)" stroke="var(--motion-edge)" />
      <text x="340" y="44" className="motion-code-label">GET /content</text>
      <path className="athub-content-line" d="M340 56H427M340 64H415M340 72H421" stroke="var(--motion-pink)" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
}

export function ServiceMotionCards() {
  const id = useId().replace(/:/g, "")
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: .15 })
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, serverReducedMotion)
  const visible = useSyncExternalStore(subscribeVisibility, getVisible, serverVisible)
  const [paused, setPaused] = useState(false)
  const [frame, setFrame] = useState(0)
  const running = inView && visible && !reducedMotion && !paused
  const step = reducedMotion ? 3 : frame

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setFrame(previous => (previous + 1) % 4), 2600)
    return () => window.clearInterval(timer)
  }, [running])

  return <div ref={ref} className="service-motion" data-running={running} data-step={step}>
    <div className="service-motion-controls">
      <IconButton label={paused ? "播放服务动画" : "暂停服务动画"} size="icon-sm" onClick={() => setPaused(previous => !previous)} disabled={reducedMotion} aria-pressed={paused}>
        {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
      </IconButton>
    </div>
    <div className="service-motion-grid">
      <article className="service-motion-card" data-service="oauth" aria-labelledby={`${id}-oauth-title`}>
        <div className="service-motion-card-heading">
          <div><h2 id={`${id}-oauth-title`}><Link2 size={21} aria-hidden="true" />OAuth</h2><p>统一登录与授权</p></div>
          <IconButton label="查看 OAuth 源码（新窗口）" size="icon-sm" nativeButton={false} render={<a href="https://github.com/AlbaTextus/oauth" target="_blank" rel="noopener noreferrer" />}><ArrowUpRight size={18} aria-hidden="true" /></IconButton>
        </div>
        <div className="service-motion-canvas" role="img" aria-label="OAuth 功能演示：邮箱、通行密钥或第三方登录，验证身份后由用户确认权限，再向应用签发访问令牌。">
          <OAuthAnimation id={`${id}-oauth`} step={step} />
        </div>
        <MotionSteps steps={oauthSteps} step={step} />
      </article>
      <article className="service-motion-card" data-service="athub" aria-labelledby={`${id}-athub-title`}>
        <div className="service-motion-card-heading">
          <div><h2 id={`${id}-athub-title`}><Database size={21} aria-hidden="true" />ATHub</h2><p>小说、分卷与章节存储</p></div>
          <IconButton label="阅读 ATHub 文档" size="icon-sm" nativeButton={false} render={<Link href={docHref("overview")} />}><ArrowUpRight size={18} aria-hidden="true" /></IconButton>
        </div>
        <div className="service-motion-canvas" role="img" aria-label="ATHub 功能演示：批量上传小说、卷和章节，在事务中写入，然后读取全书目录与章节正文。">
          <ATHubAnimation id={`${id}-athub`} step={step} />
        </div>
        <MotionSteps steps={athubSteps} step={step} />
      </article>
    </div>
  </div>
}
