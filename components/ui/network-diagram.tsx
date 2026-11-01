"use client"

import type { ComponentProps } from "react"

export type NetworkDiagramNodeProps = ComponentProps<"g"> & {
  width: number
  height: number
  x?: number
  y?: number
  muted?: boolean
}

/** A full-frame hit area, including empty space between a node's icons. */
export function NetworkDiagramNode({ width, height, x = 0, y = 0, muted = false, children, ...props }: NetworkDiagramNodeProps) {
  return <g {...props} data-network-diagram-node data-muted={muted || undefined}>
    <rect x={x} y={y} width={width} height={height} fill="transparent" stroke="none" pointerEvents="all" aria-hidden="true" />
    {children}
  </g>
}

/** Direct child paths share ATHub's flowing dashed lines and reduced-motion behavior. */
export function NetworkDiagramConnections(props: ComponentProps<"g">) {
  return <g {...props} data-network-diagram-connections aria-hidden="true" />
}
