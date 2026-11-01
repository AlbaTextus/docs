import type { CSSProperties } from "react"

/** SVG units from ATHub's network diagram; screen size also depends on the shared canvas rule. */
export const networkDiagramSizing = {
  referenceWidth: 2048,
  node: 60,
  group: 108,
  smallNode: 42,
  compactNode: 38,
  tile: 42,
  mutedTile: 41,
  icon: 20,
  mutedIcon: 19,
  inset: 9,
  gap: 6,
  radius: 2,
  handle: 6,
} as const

/** Use with data-network-diagram-canvas and the local network-diagram.css stylesheet. */
export function networkDiagramCanvasStyle(viewBoxWidth: number = networkDiagramSizing.referenceWidth): CSSProperties {
  return { "--network-diagram-ratio": viewBoxWidth / networkDiagramSizing.referenceWidth } as CSSProperties
}
