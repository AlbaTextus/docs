"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { IconButton } from "./icon-button"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  // CSS chooses the icon before hydration, using the provider's initial script.
  return <IconButton type="button" className="theme-toggle" onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")} label="切换明暗主题">
    <Moon className="theme-icon-light" aria-hidden="true" />
    <Sun className="theme-icon-dark" aria-hidden="true" />
  </IconButton>
}
