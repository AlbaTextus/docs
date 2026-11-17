"use client"

import Link from "next/link"
import { Menu } from "@base-ui/react/menu"
import { Check, ChevronsUpDown } from "lucide-react"
import { serviceHome, services, type Service } from "@/lib/navigation"
import { serviceIcons } from "./doc-icons"

export function DocumentSwitcher({ current }: { current: Service }) {
  const CurrentIcon = serviceIcons[current.id]
  return <Menu.Root modal={false}>
    <Menu.Trigger className="docs-switcher" aria-label={`选择文档项目，当前 ${current.name}`}>
      <CurrentIcon size={19} strokeWidth={1.6} />
      <span className="docs-switcher-label">{current.name}</span>
      <ChevronsUpDown className="docs-switcher-chevron" size={15} />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner side="bottom" align="start" sideOffset={7} className="docs-switcher-positioner">
        <Menu.Popup className="docs-switcher-popup" aria-label="文档项目">
          {services.map(service => {
            const Icon = serviceIcons[service.id]
            const selected = service.id === current.id
            return <Menu.LinkItem key={service.id} className="docs-switcher-option" closeOnClick aria-current={selected ? "page" : undefined} render={<Link href={serviceHome(service)} />}>
              <Icon size={19} strokeWidth={1.6} /><span>{service.name}</span>{selected && <Check size={17} className="docs-switcher-check" aria-label="当前项目" />}
            </Menu.LinkItem>
          })}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
}
