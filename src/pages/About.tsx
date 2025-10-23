import { Card } from '@components/Card'
import { Text } from '@components/Text'

// About page provides context and contact details for the Cyberstreams
// project.  It summarises the mission and highlights the open source
// nature of the solution.
export default function About() {
  return (
    <div className="stack" style={{ display: 'grid', gap: '16px' }}>
      <Card>
        <Text variant="title">Om Cyberstreams</Text>
        <Text>
          Cyberstreams er et dansk open-source projekt der stræber efter at øge
          cybersikkerhedsbevidsthed og modstandsdygtighed.  Platformen blev
          udviklet for at samle trusselsdata, automatisere overvågning og
          levere handlingsorienteret indsigt til både erhvervsliv og offentlig
          sektor.  Koden er frit tilgængelig og kan tilpasses efter behov.
        </Text>
        <Text>
          Hvis du har spørgsmål eller ønsker at bidrage, så kontakt os via
          e‑mail på <a href="mailto:info@cyberstreams.dk">info@cyberstreams.dk</a>.
        </Text>
      </Card>
    </div>
  )
}