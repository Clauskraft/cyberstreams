import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card } from '@components/Card';
import { Text } from '@components/Text';
import feeds from '@data/rssFeeds';
import DagensPuls from '@modules/DagensPuls';
/**
 * HomeContent encapsulates all UI for the public landing page of the Cyberstreams
 * portal. It displays the daily pulse stream followed by a welcome message
 * and the list of monitored RSS feeds. By isolating this logic into its own
 * module we keep the page component in `src/pages/Home.tsx` concise and make
 * it easier to reuse or refactor the home layout without affecting routing.
 */
export default function HomeContent() {
    return (_jsxs("div", { className: "stack", style: { display: 'grid', gap: '16px' }, children: [_jsx(DagensPuls, {}), _jsxs(Card, { children: [_jsx(Text, { variant: "title", children: "Velkommen til Cyberstreams" }), _jsx(Text, { children: "Cyberstreams er din centrale hub for overv\u00E5gning af hybride trusler, ransomware angreb og informationsmanipulation. Portalen kombinerer data fra officielle kilder, medier og efterretningstjenester for at give et samlet overblik i \u00E9t dashboard." })] }), _jsxs(Card, { children: [_jsx(Text, { variant: "title", children: "Overv\u00E5gede feeds" }), _jsx("ul", { style: { listStyle: 'none', paddingLeft: 0, marginTop: '8px' }, children: feeds.map(feed => (_jsx("li", { style: { marginBottom: '4px' }, children: _jsx("a", { href: feed.url, target: "_blank", rel: "noopener noreferrer", style: { textDecoration: 'none' }, children: feed.title }) }, feed.url))) })] })] }));
}
