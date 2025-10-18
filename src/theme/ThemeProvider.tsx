import React, { createContext, useContext, useMemo } from 'react'
import brandA from '@tokens/brandA.tokens.json'
import brandB from '@tokens/brandB.tokens.json'
import brandC from '@tokens/brandC.tokens.json'
import semantic from '@tokens/semantic.tokens.json'
import components from '@tokens/components.map.json'
import { resolveTheme } from './resolveTokens'

// Theme registry mapping brand names to their raw token files.  When
// adding a new brand, import its JSON here and include it in this
// registry.
const registry: Record<string, any> = { brandA, brandB, brandC }

// The shape of the context object provided to consumers.  It exposes
// both the resolved theme tree and the active brand name.
const ThemeCtx = createContext<{ theme: any; brand: string }>({ theme: {}, brand: 'brandA' })

export function ThemeProvider({ brand = 'brandA', children }: { brand?: string; children: React.ReactNode }) {
  const theme = useMemo(() => resolveTheme(registry[brand] || brandA, semantic, components), [brand])
  return <ThemeCtx.Provider value={{ theme, brand }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)