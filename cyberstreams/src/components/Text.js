import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '@theme/ThemeProvider';
import React from 'react';
// Basic text component with support for a small set of variants.  The
// variant determines font size, weight and line height.  Additional
// styling may be supplied via the 'style' prop.
export function Text({ children, variant = 'body', style }) {
    const { theme } = useTheme();
    const t = theme.components.Text[variant];
    return (_jsx("div", { style: {
            fontFamily: t.fontFamily,
            fontSize: t.size,
            lineHeight: t.lineHeight,
            fontWeight: t.weight,
            ...style
        }, children: children }));
}
export default Text;
