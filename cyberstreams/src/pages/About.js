import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card } from '@components/Card';
import { Text } from '@components/Text';
// About page provides context and contact details for the Cyberstreams
// project.  It summarises the mission and highlights the open source
// nature of the solution.
export default function About() {
    return (_jsx("div", { className: "stack", style: { display: 'grid', gap: '16px' }, children: _jsxs(Card, { children: [_jsx(Text, { variant: "title", children: "Om Cyberstreams" }), _jsx(Text, { children: "Cyberstreams er et dansk open-source projekt der str\u00E6ber efter at \u00F8ge cybersikkerhedsbevidsthed og modstandsdygtighed.  Platformen blev udviklet for at samle trusselsdata, automatisere overv\u00E5gning og levere handlingsorienteret indsigt til b\u00E5de erhvervsliv og offentlig sektor.  Koden er frit tilg\u00E6ngelig og kan tilpasses efter behov." }), _jsxs(Text, { children: ["Hvis du har sp\u00F8rgsm\u00E5l eller \u00F8nsker at bidrage, s\u00E5 kontakt os via e\u2011mail p\u00E5 ", _jsx("a", { href: "mailto:info@cyberstreams.dk", children: "info@cyberstreams.dk" }), "."] })] }) }));
}
