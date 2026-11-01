import { BookOpen, Database, KeyRound } from "lucide-react"
import { NetworkDiagramConnections } from "./ui/network-diagram"

const services = [
  { id: "oauth", Icon: KeyRound, x: 50, y: 148 },
  { id: "athub", Icon: Database, x: 298, y: 46 },
  { id: "docs", Icon: BookOpen, x: 298, y: 250 },
] as const

export function PublicServicesDiagram() {
  return <svg className="docs-services-diagram" viewBox="0 0 480 400" fill="none" role="img" aria-label="OAuth、ATHub、Docs 三个公开服务">
    <g aria-hidden="true">
      <NetworkDiagramConnections className="docs-services-connections">
        <path d="M154 200H186Q210 200 210 176V122Q210 98 234 98H298" />
        <path d="M154 200H186Q210 200 210 224V278Q210 302 234 302H298" />
        <path d="M350 150V250" />
      </NetworkDiagramConnections>
      {services.map(({ id, Icon, x, y }) => <g key={id} className="docs-service-node" data-service={id}>
        <rect className="docs-service-tile" x={x} y={y} width={104} height={104} rx={28} />
        <Icon x={x + 30} y={y + 30} width={44} height={44} strokeWidth={1.6} />
      </g>)}
    </g>
  </svg>
}
