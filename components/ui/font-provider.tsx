"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

export type FontPreference = "maple" | "system"
export type FontProviderProps = { children: ReactNode; defaultFont?: FontPreference; nonce?: string }

const storageKey = "albatextus-font"
const FontContext = createContext<{ font: FontPreference; setFont: (font: FontPreference) => void } | null>(null)

function isFont(value: unknown): value is FontPreference {
  return value === "maple" || value === "system"
}

export function FontProvider({ children, defaultFont = "maple", nonce }: FontProviderProps) {
  const fallback = isFont(defaultFont) ? defaultFont : "maple"
  const [font, updateFont] = useState<FontPreference>(fallback)
  const applyFont = useCallback((value: FontPreference) => {
    document.documentElement.dataset.atuiFont = value
    updateFont(value)
  }, [])
  const setFont = useCallback((value: FontPreference) => {
    if (!isFont(value)) return
    applyFont(value)
    try { localStorage.setItem(storageKey, value) } catch { /* Keep switching available when storage is blocked. */ }
  }, [applyFont])

  useEffect(() => {
    let initial = fallback
    try {
      const stored = localStorage.getItem(storageKey)
      if (isFont(stored)) initial = stored
    } catch { /* Use the configured default without persistent storage. */ }
    applyFont(initial)
    function sync(event: StorageEvent) {
      try { if (event.storageArea !== window.localStorage) return } catch { return }
      if (event.key === storageKey || event.key === null) applyFont(isFont(event.newValue) ? event.newValue : fallback)
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [applyFont, fallback])

  // Apply the saved font before children paint, independently of React hydration.
  const script = `(()=>{let f="${fallback}";try{const s=localStorage.getItem("${storageKey}");if(s==="maple"||s==="system")f=s}catch{}document.documentElement.dataset.atuiFont=f})()`
  return <FontContext.Provider value={{ font, setFont }}>
    <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />
    {children}
  </FontContext.Provider>
}

export function useFont() {
  const context = useContext(FontContext)
  if (!context) throw new Error("useFont must be used within FontProvider or ThemeProvider")
  return context
}
