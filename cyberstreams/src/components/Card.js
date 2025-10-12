import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '@theme/ThemeProvider';
import React from 'react';
// Simple card container component.  It applies background, colour,
// border radius, shadow and padding from the theme's Card container
// definition.  Children are rendered within.
export function Card({ children, style }) {
    const { theme } = useTheme();
    const t = theme.components.Card.container;
    return (_jsx("div", { style: {
            background: t.bg,
            color: t.color,
            borderRadius: t.radius,
            boxShadow: t.shadow,
            padding: t.padding,
            ...style
        }, children: children }));
}
export default Card;
