import React from 'react'
import { useTheme } from '@theme/ThemeProvider'

// Props for the NavBar component.  'current' holds the currently selected
// page and 'onSelect' is a callback invoked with the name of the new page
// when a navigation item is clicked.
interface NavBarProps {
  current: 'home' | 'intelligence' | 'dashboard' | 'about' | 'admin'
  onSelect: (page: 'home' | 'intelligence' | 'dashboard' | 'about' | 'admin') => void
}

export function NavBar({ current, onSelect }: NavBarProps) {
  const { theme } = useTheme()
  const items: { key: NavBarProps['current']; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'intelligence', label: 'Threat Intelligence' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'about', label: 'About' },
    { key: 'admin', label: 'Admin' }
  ]

  return (
    <nav
      style={{
        display: 'flex',
        gap: theme.space?.md || '12px',
        alignItems: 'center',
        padding: theme.space?.lg || '16px',
        background: theme.semantic.bg.brand,
        color: theme.semantic.fg.onBrand,
        boxShadow: theme.shadow?.md || '0 2px 8px rgba(0,0,0,0.12)'
      }}
    >
      {items.map(item => {
        const active = item.key === current
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            style={{
              background: active ? theme.semantic.action.primary : 'transparent',
              color: active ? theme.semantic.fg.onBrand : theme.semantic.fg.onBrand,
              border: 'none',
              padding: `${theme.space?.sm || '8px'} ${theme.space?.md || '12px'}`,
              borderRadius: theme.radius?.md || '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export default NavBar