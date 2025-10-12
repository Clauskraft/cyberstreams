import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from '@theme/ThemeProvider';
// Determine the current brand from the VITE_BRAND environment variable.  If
// none is provided (e.g. in dev mode), default to 'brandC', our custom
// Cyberstreams theme.
const brand = import.meta.env.VITE_BRAND || 'brandC';
const rootElement = document.getElementById('root');
if (!rootElement)
    throw new Error('Root element not found');
createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(ThemeProvider, { brand: brand, children: _jsx(App, {}) }) }));
