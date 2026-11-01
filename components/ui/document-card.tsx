import Link from "next/link"
import { ArrowRight, BookOpen, type LucideIcon } from "lucide-react"

export type DocumentCardProps = {
  href: string
  title: string
  description: string
  icon?: LucideIcon
}

export function DocumentCard({ href, title, description, icon: Icon = BookOpen }: DocumentCardProps) {
  return <Link href={href} className="docs-document-card">
    <div className="docs-document-card-icons" aria-hidden="true">
      <Icon size={24} strokeWidth={1.7} />
      <ArrowRight className="docs-document-card-arrow" size={20} strokeWidth={1.7} />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </Link>
}
