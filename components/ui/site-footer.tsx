"use client"

import type { ElementType } from "react"
import { Github } from "lucide-react"
import { BrandCard } from "./brand-card"
import { Separator } from "./primitives/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./primitives/tooltip"

export type SiteFooterProps = {
  brandHref?: string
  /** Opt in to the legal links above the brand card. */
  wikiOrigin?: string
  LinkComponent?: ElementType
}

export function SiteFooter({ brandHref = "/", wikiOrigin, LinkComponent = "a" }: SiteFooterProps = {}) {
  const wikiUrl = (path: string) => (wikiOrigin ?? "").replace(/\/+$/, "") + path
  return <footer className="home-footer" id="community">
    <div className="home-container">
      <div className="home-footer-grid">
        <div className="home-footer-brand">
          <LinkComponent href={brandHref} className="home-footer-wordmark" aria-label="ALBATEXTUS 首页">ALBATEXTUS</LinkComponent>
          <TooltipProvider><Tooltip>
            <TooltipTrigger render={<a className="home-footer-github" href="https://github.com/AlbaTextus" target="_blank" rel="noopener noreferrer" aria-label="GitHub 组织" />}><Github size={20} aria-hidden="true" /></TooltipTrigger>
            <TooltipContent>GitHub 组织</TooltipContent>
          </Tooltip></TooltipProvider>
        </div>
        <p className="home-footer-license">© ALBATEXTUS</p>
      </div>
      {wikiOrigin !== undefined && <>
        <Separator />
        <div className="home-footer-bottom"><nav className="home-footer-legal" aria-label="法律信息"><a href={wikiUrl("/privacy")}>隐私政策</a><a href={wikiUrl("/terms")}>服务条款</a></nav></div>
      </>}
      <BrandCard />
    </div>
  </footer>
}
