"use client"

import { Menu } from "@base-ui/react/menu"
import { Check, ChevronsUpDown, Component, Database, KeyRound } from "lucide-react"

const options = [
  { id: "athub", label: "ATHub", Icon: Database },
  { id: "atui", label: "ATUI", Icon: Component },
  { id: "oauth", label: "OAuth", Icon: KeyRound },
] as const

export function DocumentSwitcher() {
  return <Menu.Root modal={false}>
    <Menu.Trigger className="docs-switcher" aria-label="选择文档项目，当前 ATHub">
      <Database size={19} strokeWidth={1.6} />
      <span className="docs-switcher-label">ATHub</span>
      <ChevronsUpDown className="docs-switcher-chevron" size={15} />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner side="bottom" align="start" sideOffset={7} className="docs-switcher-positioner">
        <Menu.Popup className="docs-switcher-popup" aria-label="文档项目">
          {options.map(({ id, label, Icon }) => <Menu.Item key={id} className="docs-switcher-option" disabled={id !== "athub"}>
            <Icon size={19} strokeWidth={1.6} /><span>{label}</span>{id === "athub" && <Check size={17} className="docs-switcher-check" aria-label="当前项目" />}
          </Menu.Item>)}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
}
