import React, { useState } from 'react'
import { Card } from '@components/Card'
import { Text } from '@components/Text'
import { Button } from '@components/Button'

// Admin page provides controls for running data collection and updating
// the vector database.  It exposes a button that triggers an API
// endpoint (e.g. /api/run-scraper) which should be implemented in
// the backend.  The status of the operation is displayed to the user.
export default function Admin() {
  const [status, setStatus] = useState<string>('')

  async function runScraper() {
    setStatus('Kører...')
    try {
      const res = await fetch('/api/run-scraper', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStatus(`Færdig: ${data.message ?? 'Scraper har kørt færdig.'}`)
      } else {
        setStatus(`Fejl: ${res.status} ${res.statusText}`)
      }
    } catch (err: any) {
      setStatus('Fejl: ' + err.message)
    }
  }

  return (
    <div className="stack" style={{ display: 'grid', gap: '16px' }}>
      <Card>
        <Text variant="title">Administrator</Text>
        <Text>
          Denne side giver dig mulighed for at køre dataindsamlingen (scraperen)
          og opdatere vektordatabasen.  Ved at klikke på knappen nedenfor vil
          systemet hente de seneste trusselsdata og RSS‑feeds, parse indholdet med
          den integrerede open‑source scraper (Crawlee) og opdatere den interne
          vektordatabase til RAG‑anvendelser.
        </Text>
        <Button onClick={runScraper}>Start scraper</Button>
        {status && <Text style={{ marginTop: '8px' }}>{status}</Text>}
      </Card>
    </div>
  )
}