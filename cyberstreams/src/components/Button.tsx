import { useTheme } from '@theme/ThemeProvider'
import React from 'react'

type ButtonVariant = 'default' | 'danger'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

// Generic button component.  It reads its styling from the theme and
// supports a 'danger' variant for destructive actions.
export function Button({ variant = 'default', children, style, ...rest }: Props) {
  const { theme } = useTheme()
  const t = theme.components.Button[variant]
  const base: React.CSSProperties = {
    background: t.bg,
    color: t.color,
    borderRadius: t.radius,
    padding: `${t.paddingY} ${t.paddingX}`,
    boxShadow: t.shadow,
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer'
  }
  return (
    <button style={{ ...base, ...style }} {...rest}>
      {children}
    </button>
  )
}

export default Button