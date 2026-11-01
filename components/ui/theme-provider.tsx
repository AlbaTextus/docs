"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { FontProvider, type FontProviderProps } from "./font-provider"

export function ThemeProvider({ children, defaultFont, nonce }: FontProviderProps) {
  return <NextThemeProvider attribute="class" storageKey="albatextus-color-mode" defaultTheme="light" enableSystem={false} nonce={nonce}>
    <FontProvider defaultFont={defaultFont} nonce={nonce}>{children}</FontProvider>
  </NextThemeProvider>
}
