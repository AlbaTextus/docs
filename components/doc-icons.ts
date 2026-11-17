import {
  BookOpen, Braces, ClipboardCheck, Container, Database, FileCode2, FileQuestion, Fingerprint, FolderTree, Globe, HardDrive,
  Image as ImageIcon, Images, KeyRound, Layers3, LayoutGrid, Library, LifeBuoy, ListChecks, Mail, Network, Package, PenLine,
  Plug, Rocket, Server, Settings, ShieldCheck, Terminal, Upload, Users, Variable, Wrench, type LucideIcon,
} from "lucide-react"
import type { PageIcon, ServiceId } from "@/lib/navigation"

export const serviceIcons: Record<ServiceId, LucideIcon> = {
  athub: Database, oauth: ShieldCheck, image: ImageIcon, creatplat: PenLine, deploy: Rocket,
}

export const pageIcons: Record<PageIcon, LucideIcon> = {
  book: BookOpen, key: KeyRound, layers: Layers3, question: FileQuestion, code: FileCode2, checklist: ListChecks,
  server: Server, layout: LayoutGrid, plug: Plug, fingerprint: Fingerprint, mail: Mail, wrench: Wrench, braces: Braces,
  settings: Settings, drive: HardDrive, lifebuoy: LifeBuoy, review: ClipboardCheck, database: Database, network: Network,
  terminal: Terminal, variable: Variable, container: Container, package: Package, globe: Globe, folders: FolderTree,
}

// One icon per ATHub API group, in the order the groups appear in the endpoint list.
export const groupIcons: LucideIcon[] = [Database, Users, Library, Layers3, Upload, Braces, Images]
