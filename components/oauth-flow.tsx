"use client"

import { useEffect, useState, type RefObject } from "react"
import { ArrowRight, Check, Fingerprint, Github, KeyRound, Mail, MousePointer2, ShieldCheck, UserRound } from "lucide-react"

const providers = [
  { Icon: Mail, label: "邮箱" },
  { Icon: Github, label: "GitHub" },
  { Icon: KeyRound, label: "第三方 OAuth" },
]

type Playback = { ref: RefObject<HTMLElement | null>; tick: number; reduced: boolean; running: boolean }

function FlowConnection({ root, flow, cycle, reduced }: { root: Playback["ref"]; flow: "request" | "identity" | "token" | null; cycle: string; reduced: boolean }) {
  const [geometry, setGeometry] = useState({ path: "", width: 1, height: 1 })
  useEffect(() => {
    const element = root.current
    if (!element || !flow || reduced) return
    let frame = 0
    const endpoints = {
      request: ['.oauth-choice[data-active="true"]', '[data-oauth-anchor="request"]'],
      identity: ['[data-oauth-anchor="device"]', '[data-oauth-anchor="identity"]'],
      token: ['[data-oauth-anchor="token"]', '.oauth-choice[data-active="true"]'],
    }[flow]
    function measure() {
      frame = 0
      if (!element) return
      const source = element.querySelector(endpoints[0])
      const target = element.querySelector(endpoints[1])
      if (!source || !target) return
      const bounds = element.getBoundingClientRect()
      const scale = bounds.width / element.offsetWidth
      const a = source.getBoundingClientRect(), b = target.getBoundingClientRect()
      const x1 = (a.left + a.width / 2 - bounds.left) / scale
      const y1 = (flow === "token" ? a.bottom - bounds.top : a.top - bounds.top) / scale
      const x2 = (b.left + b.width / 2 - bounds.left) / scale
      const y2 = (flow === "token" ? b.top - bounds.top : b.bottom - bounds.top) / scale
      const bend = Math.max(40, Math.abs(y2 - y1) * .45)
      const direction = flow === "token" ? 1 : -1
      setGeometry({ path: `M ${x1} ${y1} C ${x1} ${y1 + bend * direction}, ${x2} ${y2 - bend * direction}, ${x2} ${y2}`, width: element.offsetWidth, height: element.offsetHeight })
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(measure) }
    measure()
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    window.addEventListener("resize", schedule)
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule) }
  }, [root, flow, cycle, reduced])
  if (!flow || reduced || !geometry.path) return null
  return <div className="oauth-flow-connection" data-flow={flow} aria-hidden="true">
    <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none"><path d={geometry.path} /></svg>
    <span className="oauth-flow-packet" key={`${flow}-${cycle}`} style={{ offsetPath: `path('${geometry.path}')` }}>{flow === "token" ? <KeyRound size={13} /> : flow === "identity" ? <Check size={13} /> : <UserRound size={13} />}</span>
  </div>
}

export function OAuthFlow({ playback }: { playback: Playback }) {
  const [selection, setSelection] = useState({ provider: 0, tick: 0 })
  const elapsed = Math.max(0, playback.tick - selection.tick)
  const cycle = Math.floor(elapsed / 28)
  const step = playback.reduced ? 26 : elapsed % 28
  const provider = (selection.provider + (playback.reduced ? 0 : cycle)) % providers.length
  const { Icon, label } = providers[provider]
  const verified = step >= 11
  const authorized = step >= 17
  const issued = step >= 19
  const delivered = step >= 23
  const scanning = step >= 5 && step < 11
  const flow = step >= 2 && step < 5 ? "request" : step >= 8 && step < 11 ? "identity" : step >= 19 && step < 23 ? "token" : null
  const cycleKey = `${selection.tick}-${selection.provider}-${cycle}`
  const choose = (index: number) => setSelection({ provider: index, tick: playback.tick })

  return <>
    <section className="service-cell service-cell-main oauth-scene" data-step={step} data-provider={provider} aria-label="授权流程演示，不执行真实登录或授权">
      <h3>授权确认</h3>
      <div className="oauth-scene-art" aria-hidden="true">
        <div className="oauth-origin" data-arrived={step >= 5} data-delivered={delivered}>
          <div className="oauth-origin-icon" data-oauth-anchor="request" key={cycleKey}><Icon size={28} strokeWidth={1.5} /></div>
          <strong>{label}</strong>
          <span>{delivered ? "已连接社区应用" : step >= 5 ? "身份请求已送达" : "发起登录请求"}</span>
          <div className="oauth-origin-result" data-ready={delivered}><KeyRound size={13} /><span>访问令牌</span><Check size={13} /></div>
        </div>
        <div className="oauth-consent-bridge" data-active={step >= 5}><i /><i /><i /><ArrowRight size={14} /></div>
        <div className="oauth-consent-card" data-authorized={authorized}>
          <div className="oauth-window-heading"><span className="oauth-at-mark">AT</span><span>社区应用</span><ShieldCheck size={18} /></div>
          <div className="oauth-identity" data-verified={verified} data-oauth-anchor="identity">
            <span className="oauth-identity-icon">{verified ? <Check size={17} /> : <Fingerprint size={18} />}</span>
            <span key={verified ? "verified" : scanning ? "scanning" : "waiting"} className="demo-state-text">{verified ? "身份已确认" : scanning ? "正在验证身份" : "等待身份验证"}</span>
            <span className="oauth-identity-line" data-scanning={scanning} />
          </div>
          <div className="oauth-scope" data-ready={verified}>
            <span>申请访问你的</span>
            <div><UserRound size={19} /><strong>基本资料</strong><span className="oauth-scope-check" data-checked={step >= 13}>{step >= 13 && <Check size={13} />}</span></div>
          </div>
          <div className="oauth-approve" data-ready={verified} data-press={step === 16} data-authorized={authorized}>
            {authorized ? <><Check size={15} />已允许授权</> : <>允许授权<ArrowRight size={15} /></>}
            {step >= 14 && step < 18 && <span className="oauth-approval-pointer"><MousePointer2 size={20} fill="white" />{step === 16 && <i />}</span>}
          </div>
          <div className="oauth-issued" data-ready={issued} data-oauth-anchor="token"><KeyRound size={14} /><span>{issued ? "访问令牌已签发" : authorized ? "正在签发令牌" : "等待授权确认"}</span>{issued && <Check size={13} />}</div>
        </div>
      </div>
    </section>
    <section className="service-cell oauth-device-cell" aria-label="通行密钥验证演示">
      <h3>通行密钥</h3>
      <div className="oauth-device" data-scanning={scanning} data-verified={verified} aria-hidden="true">
        <div className="oauth-device-sensor" data-oauth-anchor="device"><span /><Fingerprint size={36} strokeWidth={1.3} /><i /></div>
        <div className="oauth-device-copy"><strong>此设备</strong><span>{verified ? "身份验证通过" : scanning ? "正在验证身份" : "等待验证请求"}</span></div>
        <span className="oauth-device-check" data-ready={verified}><Check size={17} /></span>
        <div className="oauth-device-progress"><i key={cycleKey} data-scanning={scanning} data-ready={verified} /></div>
      </div>
    </section>
    <section className="service-cell oauth-choice-cell" aria-label="选择一种方式演示登录流程">
      <h3>多种登录方式</h3>
      <div className="oauth-choice-list">
        {providers.map(({ Icon: ProviderIcon, label: providerLabel }, index) => <button key={providerLabel} className="oauth-choice" type="button" data-active={provider === index} data-complete={provider === index && delivered} aria-pressed={provider === index} aria-label={`演示${providerLabel}登录`} onClick={() => choose(index)}>
          <ProviderIcon size={25} strokeWidth={1.5} /><span>{providerLabel}</span><span className="oauth-choice-indicator">{provider === index && delivered ? <Check size={13} /> : <ArrowRight size={13} />}</span>
        </button>)}
      </div>
    </section>
    <FlowConnection root={playback.ref} flow={flow} cycle={cycleKey} reduced={playback.reduced} />
  </>
}
