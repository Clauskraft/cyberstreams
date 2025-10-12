import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card } from '@components/Card';
import { Text } from '@components/Text';
// Dashboard page embeds the external Grafana/Elasticsearch dashboard.  The
// iframe assumes a running instance is available at the specified URL.  In
// a production environment you would protect this endpoint with
// authentication or embed tokens.
export default function Dashboard() {
    return (_jsxs("div", { className: "stack", style: { display: 'grid', gap: '16px' }, children: [_jsxs(Card, { children: [_jsx(Text, { variant: "title", children: "Live Dashboard" }), _jsx(Text, { children: "Herunder finder du et integreret live dashboard som visualiserer overv\u00E5gningsdata fra Elastic/Grafana.  Dashboardet viser realtidsstatistikker over feeds, logins og andre sikkerhedsrelaterede KPI\u2019er.  Bem\u00E6rk at dette er en placeholder \u2014 inds\u00E6t din egen dashboard-URL i src/pages/Dashboard.tsx for at forbinde til din instans." })] }), _jsx(Card, { style: { padding: 0 }, children: _jsx("iframe", { src: "https://dashboard.cyberstreams.dk/d/elastic-feed-overview", title: "Elastic/Grafana Dashboard", style: { width: '100%', height: '70vh', border: 'none', borderRadius: '8px' } }) })] }));
}
