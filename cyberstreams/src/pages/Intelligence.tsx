import React from 'react'
import { Card } from '@components/Card'
import { Text } from '@components/Text'
import threatsData from '@data/threats.json'

// Type definition for the ransomware threat entries.  It mirrors the
// structure of the JSON file.
interface Threat {
  id: number
  victim_name: string
  group_name: string
  severity: string
  country: string
  discovered_date: string
  description: string
  affected_systems: string
  ransom_amount: string
  payment_deadline: string
}

const threats: Threat[] = threatsData as unknown as Threat[]

export default function Intelligence() {
  return (
    <div className="stack" style={{ display: 'grid', gap: '16px' }}>
      <Card>
        <Text variant="title">Dark Web Ransomware Monitor</Text>
        <Text>
          Nedenfor finder du en oversigt over de aktuelt sporede ransomware angreb. Listen er baseret på
          trusselsdata fra Dark Web Monitor og opdateres løbende.  Du kan bruge denne sektion til at
          få et hurtigt overblik over alvor, mål og angrebsgrupper.
        </Text>
      </Card>
      <Card style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Offer</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Gruppe</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Severity</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Land</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Dato</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Beskrivelse</th>
            </tr>
          </thead>
          <tbody>
            {threats.map(threat => (
              <tr key={threat.id}>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{threat.victim_name}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{threat.group_name}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{threat.severity}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{threat.country}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{threat.discovered_date}</td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{threat.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}