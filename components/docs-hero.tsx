import Link from "next/link"
import { BookOpen, Github } from "lucide-react"
import { docHref } from "@/lib/navigation"
import { ServiceMotionCards } from "./service-motion-cards"

export function DocsHero() {
  return <section className="docs-hero" aria-labelledby="docs-hero-title">
    <div className="docs-hero-copy">
      <h1 id="docs-hero-title">ALBATEXTUS<span>文档</span></h1>
      <div className="docs-hero-actions">
        <Link className="docs-hero-action docs-hero-action-primary" href={docHref("overview")}><BookOpen size={19} aria-hidden="true" />快速开始</Link>
        <a className="docs-hero-action" href="https://github.com/AlbaTextus" target="_blank" rel="noopener noreferrer"><Github size={19} aria-hidden="true" />GitHub</a>
      </div>
    </div>
    <ServiceMotionCards />
  </section>
}
