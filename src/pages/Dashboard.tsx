import { Card } from '@components/Card'
import { Text } from '@components/Text'

// Dashboard page embeds the external Grafana/Elasticsearch dashboard.  The
// iframe assumes a running instance is available at the specified URL.  In
// a production environment you would protect this endpoint with
// authentication or embed tokens.
export default function Dashboard() {
  return (
    <div className="stack" style={{ display: 'grid', gap: '16px' }}>
      <Card>
        <Text variant="title">Live Dashboard</Text>
        <Text>
          Herunder finder du et integreret live dashboard som visualiserer overvågningsdata fra
          Elastic/Grafana.  Dashboardet viser realtidsstatistikker over feeds, logins og andre
          sikkerhedsrelaterede KPI’er.  Bemærk at dette er en placeholder — indsæt din egen
          dashboard-URL i src/pages/Dashboard.tsx for at forbinde til din instans.
        </Text>
      </Card>
      <Card style={{ padding: 0 }}>
        <iframe
          src="https://dashboard.cyberstreams.dk/d/elastic-feed-overview"
          title="Elastic/Grafana Dashboard"
          style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }}
        />
      </Card>
    </div>
  )
}