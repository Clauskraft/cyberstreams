import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Card } from '@components/Card';
import { Text } from '@components/Text';
import { Button } from '@components/Button';
// Admin page provides controls for running data collection and updating
// the vector database.  It exposes a button that triggers an API
// endpoint (e.g. /api/run-scraper) which should be implemented in
// the backend.  The status of the operation is displayed to the user.
export default function Admin() {
    const [status, setStatus] = useState('');
    async function runScraper() {
        setStatus('Kører...');
        try {
            const res = await fetch('/api/run-scraper', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setStatus(`Færdig: ${data.message ?? 'Scraper har kørt færdig.'}`);
            }
            else {
                setStatus(`Fejl: ${res.status} ${res.statusText}`);
            }
        }
        catch (err) {
            setStatus('Fejl: ' + err.message);
        }
    }
    return (_jsx("div", { className: "stack", style: { display: 'grid', gap: '16px' }, children: _jsxs(Card, { children: [_jsx(Text, { variant: "title", children: "Administrator" }), _jsx(Text, { children: "Denne side giver dig mulighed for at k\u00F8re dataindsamlingen (scraperen) og opdatere vektordatabasen.  Ved at klikke p\u00E5 knappen nedenfor vil systemet hente de seneste trusselsdata og RSS\u2011feeds, parse indholdet med den integrerede open\u2011source scraper (Crawlee) og opdatere den interne vektordatabase til RAG\u2011anvendelser." }), _jsx(Button, { onClick: runScraper, children: "Start scraper" }), status && _jsx(Text, { style: { marginTop: '8px' }, children: status })] }) }));
}
