import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useTheme } from '@theme/ThemeProvider';
export function NavBar({ current, onSelect }) {
    const { theme } = useTheme();
    const items = [
        { key: 'home', label: 'Home' },
        { key: 'intelligence', label: 'Threat Intelligence' },
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'about', label: 'About' },
        { key: 'admin', label: 'Admin' }
    ];
    return (_jsx("nav", { style: {
            display: 'flex',
            gap: theme.space?.md || '12px',
            alignItems: 'center',
            padding: theme.space?.lg || '16px',
            background: theme.semantic.bg.brand,
            color: theme.semantic.fg.onBrand,
            boxShadow: theme.shadow?.md || '0 2px 8px rgba(0,0,0,0.12)'
        }, children: items.map(item => {
            const active = item.key === current;
            return (_jsx("button", { onClick: () => onSelect(item.key), style: {
                    background: active ? theme.semantic.action.primary : 'transparent',
                    color: active ? theme.semantic.fg.onBrand : theme.semantic.fg.onBrand,
                    border: 'none',
                    padding: `${theme.space?.sm || '8px'} ${theme.space?.md || '12px'}`,
                    borderRadius: theme.radius?.md || '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                }, children: item.label }, item.key));
        }) }));
}
export default NavBar;
