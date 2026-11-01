"use client"

import type { ComponentProps } from "react"
import { Button } from "./primitives/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./primitives/tooltip"

export type IconButtonProps = Omit<ComponentProps<typeof Button>, "size" | "aria-label" | "title"> & {
  label: string
  size?: "icon" | "icon-sm" | "icon-lg" | "icon-xs"
}

/** One icon, one accessible name, and a hover/focus label. */
export function IconButton({ label, size = "icon", variant = "ghost", children, ...props }: IconButtonProps) {
  return <TooltipProvider><Tooltip>
    <TooltipTrigger render={<Button {...props} size={size} variant={variant} aria-label={label} />}>
      {children}
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip></TooltipProvider>
}
