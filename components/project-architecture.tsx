"use client"

import { useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react"
import { BookOpen, Braces, Component, FileCode2, FileText, Globe2, Library, NotebookText, Search, UserRound, type LucideIcon } from "lucide-react"
import { NetworkDiagramConnections, NetworkDiagramNode } from "./ui/network-diagram"
import { networkDiagramSizing as sizes, networkDiagramCanvasStyle } from "@/lib/network-diagram-sizing"

type Position = { x: number; y: number }
type MovableNode = "apps" | "data"
const initialPositions = {
  desktop: { apps: { x: 830, y: 90 }, data: { x: 644, y: 276 } },
  mobile: { apps: { x: 214, y: 392 }, data: { x: 54, y: 438 } },
}
const nodes = {
  apps: { width: sizes.group, height: sizes.group, label: "文档分类" },
  data: { width: sizes.node, height: sizes.node, label: "项目文档" },
}
function subscribeLayout(onChange: () => void) {
  const query = window.matchMedia("(max-width: 760px)")
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
const getMobileLayout = () => window.matchMedia("(max-width: 760px)").matches
const getServerLayout = () => false

function SelectionFrame({ width, height }: { width: number; height: number }) {
  return <g className="diagram-demo-frame" aria-hidden="true">
    <rect width={width} height={height} />
    {[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => <rect key={`${x}-${y}`} x={x - sizes.handle / 2} y={y - sizes.handle / 2} width={sizes.handle} height={sizes.handle} className="diagram-demo-handle" />)}
  </g>
}
function IconTile({ icon: Icon, x = sizes.inset, y = sizes.inset, size = sizes.tile, iconSize = sizes.icon }: { icon: LucideIcon; x?: number; y?: number; size?: number; iconSize?: number }) {
  return <g aria-hidden="true"><rect x={x} y={y} width={size} height={size} rx={sizes.radius} className="diagram-demo-tile" /><Icon x={x + (size - iconSize) / 2} y={y + (size - iconSize) / 2} width={iconSize} height={iconSize} strokeWidth={1.5} /></g>
}
function svgPosition(svg: SVGSVGElement, clientX: number, clientY: number) {
  const matrix = svg.getScreenCTM()
  return matrix ? new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse()) : null
}

/** The original diagram composition stays a demo; shared primitives own sizing and motion. */
export function ProjectArchitecture({ compact = false, vertical = false }: { compact?: boolean; vertical?: boolean }) {
  const id = useId()
  const mobileLayout = useSyncExternalStore(subscribeLayout, getMobileLayout, getServerLayout)
  const mobile = !compact && (vertical || mobileLayout)
  const layout = mobile ? "mobile" : "desktop"
  const [layouts, setLayouts] = useState(initialPositions)
  const positions = layouts[layout]
  const [dragging, setDragging] = useState<MovableNode | null>(null)
  const drag = useRef<{ node: MovableNode; pointerId: number; offset: Position } | null>(null)

  function moveNode(node: MovableNode, position: Position) {
    const { width, height } = nodes[node]
    const next = { x: Math.max(36, Math.min(position.x, (mobile ? 384 : 1084) - width)), y: Math.max(36, Math.min(position.y, (mobile ? 552 : 352) - height)) }
    setLayouts(current => ({ ...current, [layout]: { ...current[layout], [node]: next } }))
  }
  function startDrag(event: PointerEvent<SVGGElement>, node: MovableNode) {
    if (compact || event.button !== 0 || !event.isPrimary || drag.current) return
    const svg = event.currentTarget.ownerSVGElement
    const point = svg && svgPosition(svg, event.clientX, event.clientY)
    if (!point) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { node, pointerId: event.pointerId, offset: { x: point.x - positions[node].x, y: point.y - positions[node].y } }
    setDragging(node)
  }
  function moveDrag(event: PointerEvent<SVGGElement>) {
    const active = drag.current
    const svg = event.currentTarget.ownerSVGElement
    if (!active || active.pointerId !== event.pointerId || !svg) return
    const point = svgPosition(svg, event.clientX, event.clientY)
    if (point) moveNode(active.node, { x: point.x - active.offset.x, y: point.y - active.offset.y })
  }
  function endDrag(event: PointerEvent<SVGGElement>) {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    setDragging(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  function moveWithKeyboard(event: KeyboardEvent<SVGGElement>, node: MovableNode) {
    if (event.key === "Escape" && !drag.current) { event.preventDefault(); setLayouts(initialPositions); return }
    const directions: Record<string, Position> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
    const direction = directions[event.key]
    if (!direction || drag.current) return
    event.preventDefault()
    const step = event.shiftKey ? 24 : 8
    moveNode(node, { x: positions[node].x + direction.x * step, y: positions[node].y + direction.y * step })
  }

  return <div className="diagram-demo" data-network-diagram-viewport data-compact={compact || undefined} data-layout={mobile ? "vertical" : "horizontal"}>
    <svg className="diagram-demo-canvas" data-network-diagram-canvas style={networkDiagramCanvasStyle(mobile ? 420 : 1120)}
      viewBox={mobile ? "0 0 420 610" : "0 0 1120 410"} fill="none" role={compact ? "img" : "group"} aria-labelledby={`${id}-title`} aria-describedby={compact ? undefined : `${id}-description ${id}-help`}>
      <title id={`${id}-title`}>文档架构图</title>
      <desc id={`${id}-description`}>读者通过搜索与目录查阅文档，连接组件、API、调用示例与项目文档。</desc>
      <desc id={`${id}-help`}>彩色节点可拖动。聚焦后可使用方向键移动，按住换挡键加快，退出键重置布局。</desc>
      <NetworkDiagramConnections>
        <path d={mobile ? "M95 102H212" : "M133 168C188 168 202 143 256 143"} />
        <path d={mobile ? "M266 132.5C266 166 285 176 285 213" : "M364 143C435 143 447 171 525 171"} />
        <path d={mobile ? "M107 238C176 238 196 243 255 243" : "M327 289C428 289 441 186 525 186"} />
        <path d={mobile ? `M315 243C406 243 ${positions.apps.x + sizes.group + 38} ${positions.apps.y + sizes.group / 2} ${positions.apps.x + sizes.group} ${positions.apps.y + sizes.group / 2}` : `M585 171C710 171 ${positions.apps.x - 100} ${positions.apps.y + sizes.group / 2} ${positions.apps.x} ${positions.apps.y + sizes.group / 2}`} />
        <path d={mobile ? `M285 273C285 339 ${positions.data.x + sizes.node / 2} ${positions.data.y - 64} ${positions.data.x + sizes.node / 2} ${positions.data.y}` : `M555 201C555 249 ${positions.data.x + sizes.node / 2} ${positions.data.y - 48} ${positions.data.x + sizes.node / 2} ${positions.data.y}`} />
      </NetworkDiagramConnections>
      <NetworkDiagramNode muted width={sizes.smallNode} height={sizes.smallNode} transform={mobile ? "translate(53 81)" : "translate(91 147)"}>
        <SelectionFrame width={sizes.smallNode} height={sizes.smallNode} /><UserRound x={11} y={11} width={sizes.icon} height={sizes.icon} strokeWidth={1.6} aria-hidden="true" />
      </NetworkDiagramNode>
      <NetworkDiagramNode muted width={sizes.group} height={61} transform={mobile ? "translate(212 71.5)" : "translate(256 112.5)"}>
        <SelectionFrame width={sizes.group} height={61} /><IconTile icon={Search} y={10} size={sizes.mutedTile} iconSize={sizes.mutedIcon} /><IconTile icon={FileText} x={57} y={10} size={sizes.mutedTile} iconSize={sizes.mutedIcon} />
      </NetworkDiagramNode>
      <NetworkDiagramNode muted width={sizes.compactNode} height={sizes.compactNode} transform={mobile ? "translate(69 219)" : "translate(289 270)"}>
        <SelectionFrame width={sizes.compactNode} height={sizes.compactNode} /><Globe2 x={sizes.inset} y={sizes.inset} width={sizes.icon} height={sizes.icon} strokeWidth={1.6} aria-hidden="true" />
      </NetworkDiagramNode>
      <NetworkDiagramNode width={sizes.node} height={sizes.node} className="diagram-demo-core" transform={mobile ? "translate(255 213)" : "translate(525 141)"}>
        <SelectionFrame width={sizes.node} height={sizes.node} /><IconTile icon={BookOpen} />
      </NetworkDiagramNode>
      {(["apps", "data"] as const).map(node => <NetworkDiagramNode key={node} width={nodes[node].width} height={nodes[node].height} className="diagram-demo-movable" data-node={node} data-dragging={dragging === node || undefined}
        transform={`translate(${positions[node].x} ${positions[node].y})`} role={compact ? undefined : "group"} aria-roledescription={compact ? undefined : "可拖动节点"} aria-label={compact ? undefined : nodes[node].label} aria-describedby={compact ? undefined : `${id}-help`} tabIndex={compact ? undefined : 0}
        onPointerDown={event => startDrag(event, node)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onKeyDown={event => moveWithKeyboard(event, node)}>
        <SelectionFrame width={nodes[node].width} height={nodes[node].height} />
        {node === "apps" ? <><IconTile icon={Component} /><IconTile icon={Braces} x={sizes.inset + sizes.tile + sizes.gap} /><IconTile icon={FileCode2} y={sizes.inset + sizes.tile + sizes.gap} /><IconTile icon={NotebookText} x={sizes.inset + sizes.tile + sizes.gap} y={sizes.inset + sizes.tile + sizes.gap} /></> : <IconTile icon={Library} />}
      </NetworkDiagramNode>)}
    </svg>
  </div>
}
