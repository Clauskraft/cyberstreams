import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Card } from '@components/Card';
import { Text } from '@components/Text';
// DagensPuls module fetches the daily pulse from the backend API and
// displays each item in a list.  If the request fails, an error
// message is shown.  This component can be embedded in any page,
// including the front page (Home) to provide a live info stream.
export default function DagensPuls() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pulse, setPulse] = useState([]);
    useEffect(() => {
        async function fetchPulse() {
            try {
                setLoading(true);
                const res = await fetch('/api/pulse');
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setPulse(data.pulse);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }
        fetchPulse();
    }, []);
    return (_jsxs(Card, { children: [_jsx(Text, { variant: "title", children: "Dagens Puls" }), loading && _jsx(Text, { children: "Henter dagens puls\u2026" }), error && _jsxs(Text, { style: { color: 'red' }, children: ["Fejl: ", error] }), !loading && !error && pulse.length === 0 && _jsx(Text, { children: "Ingen indhold tilg\u00E6ngeligt." }), _jsx("ul", { style: { listStyle: 'none', padding: 0, marginTop: '8px' }, children: pulse.map(item => (_jsx("li", { style: { marginBottom: '8px' }, children: _jsx(Card, { style: { padding: '8px' }, children: _jsx(Text, { children: item.summary }) }) }, item.id))) })] }));
}
