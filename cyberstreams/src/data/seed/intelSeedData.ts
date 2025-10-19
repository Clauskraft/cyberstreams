import { IntelSeedPayload } from '@/services/intel/IntelVectorService'

export const intelSeedData: IntelSeedPayload = {
  articles: [
    {
      id: 'article-001',
      title: 'CFCS: Kritisk ransomware kampagne mod dansk sundhedssektor',
      body: 'CFCS advarer om en sofistikeret ransomware bølge som målretter danske hospitaler og sundhedsleverandører.',
      type: 'article',
      tags: ['ransomware', 'healthcare', 'denmark'],
      source: 'cfcs.dk',
      timestamp: '2025-01-12T08:15:00Z',
      metadata: {
        severity: 'critical',
        region: 'DK',
      },
    },
    {
      id: 'article-002',
      title: 'ENISA rapporterer stigning i AI-drevne phishing angreb',
      body: 'Ny rapport viser 45% stigning i AI-genererede phishing kampagner på tværs af EU.',
      type: 'article',
      tags: ['ai', 'phishing', 'eu'],
      source: 'enisa.europa.eu',
      timestamp: '2025-01-11T10:00:00Z',
      metadata: {
        severity: 'high',
        region: 'EU',
      },
    },
  ],
  threats: [
    {
      id: 'threat-001',
      title: 'LockBit 3.0 udvider operationsmodellen til norden',
      body: 'LockBit annoncerer nye affiliates med specifik fokus på energi og finans i Danmark og Sverige.',
      type: 'threat',
      tags: ['lockbit', 'ransomware', 'energy'],
      source: 'darkweb-forums',
      timestamp: '2025-01-12T06:45:00Z',
      metadata: {
        severity: 'high',
        actor: 'LockBit',
        confidence: 0.82,
      },
    },
    {
      id: 'threat-002',
      title: 'APT28 spearphishing mod nordiske regeringskontorer',
      body: 'Identificerede kampagner benytter kompromitterede Microsoft 365 konti og multi-stage malware.',
      type: 'threat',
      tags: ['apt28', 'government', 'espionage'],
      source: 'cert-eu',
      timestamp: '2025-01-10T20:10:00Z',
      metadata: {
        severity: 'critical',
        confidence: 0.91,
      },
    },
  ],
  incidents: [
    {
      id: 'incident-001',
      title: 'Dansk energiselskab oplever afbrydelser efter ICS kompromittering',
      body: 'Netværkslog viser uautoriserede kommandoer mod SCADA systemer via kompromitteret VPN.',
      type: 'incident',
      tags: ['ics', 'energy', 'vpn'],
      source: 'internal-soc',
      timestamp: '2025-01-09T18:20:00Z',
      metadata: {
        impact: 'high',
        affectedSystems: ['SCADA', 'VPN Gateway'],
      },
    },
    {
      id: 'incident-002',
      title: 'Credential dump afslører danske kommuners cloud konti',
      body: 'Data leak forum publicerer 50k credentials relateret til kommunale Microsoft 365 konti.',
      type: 'incident',
      tags: ['credential', 'm365', 'leak'],
      source: 'breach-market',
      timestamp: '2025-01-08T12:05:00Z',
      metadata: {
        impact: 'medium',
        affectedUsers: 50000,
      },
    },
  ],
  compliance: [
    {
      id: 'compliance-001',
      title: 'Ny dansk cybersikkerhedslov kræver 24-timers incidentrapportering',
      body: 'Folketinget vedtager lov der pålægger kritisk infrastruktur at rapportere alvorlige hændelser inden for 24 timer.',
      type: 'compliance',
      tags: ['compliance', 'legislation', 'denmark'],
      source: 'ft.dk',
      timestamp: '2025-01-07T09:00:00Z',
      metadata: {
        effectiveFrom: '2025-06-01',
        sector: 'critical-infrastructure',
      },
    },
    {
      id: 'compliance-002',
      title: 'EU DORA vejledning opdateres med nye cloud krav',
      body: 'Den Europæiske Banktilsynsmyndighed præciserer krav til cloud leverandørers sikkerhedskontroller for finansielle institutioner.',
      type: 'compliance',
      tags: ['dora', 'finance', 'cloud'],
      source: 'eba.europa.eu',
      timestamp: '2025-01-05T16:30:00Z',
      metadata: {
        sector: 'financial-services',
      },
    },
  ],
}
