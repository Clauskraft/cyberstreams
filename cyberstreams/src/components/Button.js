import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '@theme/ThemeProvider';
import React from 'react';
// Generic button component.  It reads its styling from the theme and
// supports a 'danger' variant for destructive actions.
export function Button({ variant = 'default', children, style, ...rest }) {
    const { theme } = useTheme();
    const t = theme.components.Button[variant];
    const base = {
        background: t.bg,
        color: t.color,
        borderRadius: t.radius,
        padding: `${t.paddingY} ${t.paddingX}`,
        boxShadow: t.shadow,
        border: 'none',
        fontWeight: 600,
        cursor: 'pointer'
    };
    return (_jsx("button", { style: { ...base, ...style }, ...rest, children: children }));
}
export default Button;
