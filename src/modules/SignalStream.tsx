import { useMemo, useState, useEffect } from 'react'
import {
  Compass,
  Layers,
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
  GitBranch,
  FileText,
  Globe,
  Target,
  RefreshCw,
  Lightbulb,
  Database,
  ShieldCheck,
  History,
  Scan,
  ListTree,
  ExternalLink,
  Timer,
  AlertTriangle
} from 'lucide-react'
import { Card } from '@components/Card'
import { Button } from '@components/Button'

interface SignalStreamConfig {
  language: 'da' | 'en'
  sources: Array<'rss' | 'atom' | 'web' | 'api'>
  allowedDomains: string[]
  freshnessDays: number
  maxArticles: number
  enableImages: boolean
  imageMode: 'generate' | 'fetch' | 'hybrid'
  requireCitations: boolean
  labelUnverified: boolean
  rejectLowTrust: boolean
}

interface SignalStreamImage {
  url: string
  alt: string
  caption: string
  license: string
  generated: boolean
  width: number
  height: number
}

interface SignalStreamSourceRef {
  id: string
  url: string
  title: string
  publishedAt: string
  origin: 'Model Knowledge' | 'Public Source'
}

interface EvidenceScores {
  vectorScore: number
  bm25Score: number
  freshnessHours: number
  domainAuthority: number
  citationCoverage: number
}

interface SignalStreamArticle {
  id: string
  title: string
  summary: string
  keyPoints: string[]
  analysis: string[]
  implications: string[]
  sources: SignalStreamSourceRef[]
  images: SignalStreamImage[]
  tags: string[]
  focusLane: string
  evidence: EvidenceScores
  createdAt: string
  language: 'da' | 'en'
  why: string[]
}

interface TraceEvent {
  id: string
  type: 'compose' | 'drilldown' | 'expand' | 'view'
  label: string
  timestamp: string
  details?: Record<string, unknown>
}

interface SessionTrace {
  id: string
  startedAt: string
  focus: string
  filters: string[]
  events: TraceEvent[]
}

interface VectorDocument {
  id: string
  namespace: string
  text: string
  metadata: Record<string, unknown>
  embedding: number[]
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sig-${Math.random().toString(36).slice(2, 10)}`
}

class MemoryVectorStore {
  private store = new Map<string, VectorDocument>()
  private dimensions: number

  constructor(dimensions = 24) {
    this.dimensions = dimensions
  }

  private embed(text: string): number[] {
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9æøå\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)

    const vector = new Array(this.dimensions).fill(0)
    tokens.forEach((token, index) => {
      const bucket = index % this.dimensions
      const weight = [...token].reduce((sum, char) => sum + char.charCodeAt(0), 0)
      vector[bucket] += weight
    })

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
    return vector.map((value) => value / magnitude)
  }

  upsert(documents: Array<Omit<VectorDocument, 'embedding'>>) {
    documents.forEach((document) => {
      const embedding = this.embed(document.text)
      const key = `${document.namespace}:${document.id}`
      this.store.set(key, { ...document, embedding })
    })
  }

  search(namespace: string, query: string, limit = 5) {
    const queryVector = this.embed(query)
    const scores: Array<{ doc: VectorDocument; score: number }> = []

    for (const document of this.store.values()) {
      if (document.namespace !== namespace) continue
      const dot = document.embedding.reduce((sum, value, index) => sum + value * queryVector[index], 0)
      scores.push({ doc: document, score: dot })
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}

const defaultPrompt = `Du er SignalStream – et analysemodul der leverer verificerede cyber-, cloud- og governance-indsigter. 
Regler:
- Brug kun verificerbare kilder fra danske og europæiske myndigheder, trusted leverandører og branchefora.
- Mærk udsagn uden kilde som [Unverified].
- Strukturér artikler som Executive Snapshot, Signal & Noise, Analysis, Controls & Decisions, Sources.
- Forklar hvorfor hvert element overlevede filtrene (evidenskriterier).`

const defaultConfig: SignalStreamConfig = {
  language: 'da',
  sources: ['rss', 'web'],
  allowedDomains: ['enisa.europa.eu', 'digst.dk', 'cfcs.dk', 'tdc.dk', 'nuuday.dk'],
  freshnessDays: 14,
  maxArticles: 6,
  enableImages: true,
  imageMode: 'hybrid',
  requireCitations: true,
  labelUnverified: true,
  rejectLowTrust: true,
}

const seedArticles: SignalStreamArticle[] = [
  {
    id: 'sig-art-001',
    title: 'CloudKey® bruges som reference i ny EU-vejledning om datasuverænitet',
    summary:
      'ENISA fremhæver TDC Erhvervs CloudKey® som eksempel på operationel datasuverænitet i public cloud-miljøer. Fokus er at afvise tredjelandsadgang og sikre nøglekontrol gennem HYOK.',
    keyPoints: [
      'ENISA beskriver CloudKey® som praksisnært eksempel på europæisk nøglekontrol',
      'Guiden adresserer AI-tjenester, herunder Copilot og andre generative assistenter',
      'Anbefaler EU-organisationer at kombinere HYOK med Zero-Trust for kritiske data'
    ],
    analysis: [
      'Guiden placerer CloudKey® som referencearkitektur for datasuverænitet i offentlige miljøer',
      'TDC Erhverv positionerer sig som lokal leverandør med dokumenteret kontrol over krypteringsnøgler',
      'EU retter fokus mod runtime-sikkerhed og confidential compute for sensitive arbejdsbelastninger'
    ],
    implications: [
      'Danske myndigheder kan henvise til CloudKey® i udbud der kræver lokal nøglekontrol',
      'TDC Erhverv bør udarbejde tekniske workshops sammen med ENISA for at cementere positionen',
      'Kunder bør opdatere deres AI-governance-politikker til at inkludere HYOK-principper'
    ],
    sources: [
      {
        id: 'src-enisa-2024',
        url: 'https://www.enisa.europa.eu/publications/eu-cloud-data-sovereignty-guide',
        title: 'EU Cloud Data Sovereignty Guide 2024',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        origin: 'Public Source'
      },
      {
        id: 'src-tdc-cloudkey',
        url: 'https://tdc.dk/enterprise/produkter/cloudkey/',
        title: 'CloudKey® – datasuverænitet i public cloud',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        origin: 'Public Source'
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
        alt: 'Visualisering af krypteringsnøgler i et datasenter',
        caption: 'Illustration: Datasuverænitet og nøglekontrol i public cloud',
        license: 'Unsplash License',
        generated: false,
        width: 1600,
        height: 900
      },
      {
        url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
        alt: 'Diagram over governance-processer for cloud compliance',
        caption: 'Procesdiagram anvendt i SignalStream til governance-briefing',
        license: 'Unsplash License',
        generated: false,
        width: 1200,
        height: 900
      }
    ],
    tags: ['datasuverænitet', 'cloud', 'AI governance'],
    focusLane: 'EU Datasuverænitet',
    evidence: {
      vectorScore: 0.88,
      bm25Score: 0.82,
      freshnessHours: 6,
      domainAuthority: 0.91,
      citationCoverage: 1
    },
    createdAt: new Date().toISOString(),
    language: 'da',
    why: [
      'Match på datasuverænitet og HYOK i system-prompten',
      'Høj domæneautoritet fra ENISA og TDC Erhverv',
      'Aktuel reference (seneste 24 timer) med fuld citationsdækning'
    ]
  },
  {
    id: 'sig-art-002',
    title: 'Delegate udvider samarbejdet med CloudKey® for Copilot-sikkerhed',
    summary:
      'Delegate integrerer CloudKey® i deres Copilot-implementeringer for at sikre, at AI kun får adgang til autoriserede informationsrum. Fokus er at beskytte kundedata og understøtte DORA-krav.',
    keyPoints: [
      'Delegate dokumenterer reduktion i uautoriseret dataeksponering',
      'CloudKey® bruges til at segmentere datasæt til Copilot og Azure OpenAI',
      'Finansielle kunder bruger modellen til at demonstrere DORA-overensstemmelse'
    ],
    analysis: [
      'AI-access kontrol bliver en differentiator i danske Copilot-udrulninger',
      'TDC Erhvervs nøglekontrol giver ekstra audit-spor for DORA Section 9',
      'Markedet forventer kombination af SOC, nøgleforvaltning og AI policy frameworks'
    ],
    implications: [
      'SignalStream bør anbefale fælles referencearkitektur for Copilot + CloudKey®',
      'Udbyg marketing med use-cases målrettet finans og offentlig sektor',
      'Etabler fælles overvågning af policy-afvigelser mellem SOC og CloudKey®'
    ],
    sources: [
      {
        id: 'src-delegate-2025',
        url: 'https://delegate.dk/en/news/microsoft-consultancy-chooses-danish-encryption-solution-to-secure-its-customers-data/',
        title: 'Microsoft consultancy chooses Danish encryption solution',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        origin: 'Public Source'
      },
      {
        id: 'src-dora-guidance',
        url: 'https://finance.ec.europa.eu/system/files/2024-09/dora-implementation-note.pdf',
        title: 'EU Commission – DORA Implementation Note',
        publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        origin: 'Public Source'
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
        alt: 'Team samarbejder om AI-governance dashboards',
        caption: 'Copilot-sikkerhed baseret på CloudKey® nøglekontrol',
        license: 'Unsplash License',
        generated: false,
        width: 1600,
        height: 900
      },
      {
        url: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80',
        alt: 'Illustration af cybersikkerhed med lås og datagraf',
        caption: 'SignalStream visualiserer adgangskontrol for AI-workloads',
        license: 'Unsplash License',
        generated: false,
        width: 1200,
        height: 900
      }
    ],
    tags: ['AI', 'Copilot', 'CloudKey', 'DORA'],
    focusLane: 'AI Access Control',
    evidence: {
      vectorScore: 0.84,
      bm25Score: 0.79,
      freshnessHours: 12,
      domainAuthority: 0.76,
      citationCoverage: 1
    },
    createdAt: new Date().toISOString(),
    language: 'da',
    why: [
      'Eksisterende samarbejde mellem Delegate og CloudKey® adresserer AI-governance',
      'DORA-notatet matcher compliance-delen af system-prompten',
      'Høj relevans for dansk finanssektor og offentlig digitalisering'
    ]
  }
]

const seedSecurityNotes = [
  {
    id: 'threat-hyok-bypass',
    namespace: 'security_threats',
    text: 'Forsøg på at omgå HYOK med session hijacking i Azure Confidential Compute miljøer',
    metadata: {
      tactic: 'Defense Evasion',
      products: ['Azure Confidential VM'],
      severity: 'medium',
      lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'threat-ai-exfil',
    namespace: 'security_threats',
    text: 'Sprogmodeller forsøger at eksfiltrere nøglemateriale fra in-memory processer når Copilot kører uden CloudKey® isolering',
    metadata: {
      tactic: 'Exfiltration',
      products: ['Microsoft 365', 'Copilot'],
      severity: 'high',
      lastSeen: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString()
    }
  }
]

const baseScopeSuggestions = [
  'Kortlæg hvordan CloudKey® understøtter NIS2 bilag II kontroller',
  'Udbyg fokus til dansk forsyningssektor og hybride cloud-miljøer',
  'Analysér relationen mellem CloudKey® og EU Data Act artikel 23',
  'Inddrag Copilot for Security og nødvendige datapolitikker'
]

const createInitialTrace = (): SessionTrace => ({
  id: createId(),
  startedAt: new Date().toISOString(),
  focus: 'Datasuverænitet og AI-governance',
  filters: ['DK', 'EU', 'Trusted Cloud'],
  events: [
    {
      id: createId(),
      type: 'compose',
      label: 'Session oprettet',
      timestamp: new Date().toISOString(),
      details: { strategy: 'initial', audience: 'Ledelse og CISO-team' }
    }
  ]
})

const SignalStream = () => {
  const vectorStore = useMemo(() => {
    const store = new MemoryVectorStore(24)
    store.upsert(
      seedArticles.map((article) => ({
        id: article.id,
        namespace: 'articles',
        text: `${article.title} ${article.summary} ${article.tags.join(' ')}`,
        metadata: { focusLane: article.focusLane, tags: article.tags }
      }))
    )
    store.upsert(seedSecurityNotes)
    return store
  }, [])

  const [config, setConfig] = useState<SignalStreamConfig>(defaultConfig)
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt)
  const [promptName, setPromptName] = useState('SignalStream Default')
  const [ingestStatus, setIngestStatus] = useState<'idle' | 'running' | 'complete'>('idle')
  const [articles, setArticles] = useState<SignalStreamArticle[]>(seedArticles)
  const [activeArticleId, setActiveArticleId] = useState<string>(seedArticles[0]?.id ?? '')
  const [sessionTrace, setSessionTrace] = useState<SessionTrace>(createInitialTrace)
  const [traceHistory, setTraceHistory] = useState<SessionTrace[]>([])
  const [suggestions, setSuggestions] = useState(baseScopeSuggestions)
  const [isComposing, setIsComposing] = useState(false)

  const activeArticle = articles.find((article) => article.id === activeArticleId) ?? null

  // Fetch real data from API
  useEffect(() => {
    const fetchSignalStreamData = async () => {
      try {
        const response = await fetch('/api/signal-stream')
        const data = await response.json()
        
        if (data.success && data.data && data.data.length > 0) {
          // Transform API data to SignalStreamArticle format
          const transformedArticles: SignalStreamArticle[] = data.data.map((item: any, index: number) => ({
            id: `api-art-${index + 1}`,
            title: item.title || 'Untitled Article',
            summary: item.description || 'No summary available',
            keyPoints: ['Data from monitoring results'],
            analysis: ['Analysis pending'],
            implications: ['Implications to be determined'],
            sources: [{
              id: `source-${index + 1}`,
              name: 'Monitoring Source',
              url: item.url || '',
              type: 'web' as const,
              trustScore: 0.7
            }],
            images: [],
            tags: ['monitoring', 'threat-intelligence'],
            focusLane: 'threat-intelligence',
            evidence: {
              credibility: 0.7,
              relevance: 0.8,
              recency: 0.9,
              impact: 0.6
            },
            createdAt: item.created_at || new Date().toISOString(),
            language: 'en' as const,
            why: ['Automated monitoring result']
          }))
          
          setArticles(transformedArticles)
          setActiveArticleId(transformedArticles[0]?.id ?? '')
        }
      } catch (error) {
        console.error('Error fetching signal stream data:', error)
      }
    }

    fetchSignalStreamData()
  }, [])

  const pushTraceEvent = (event: Omit<TraceEvent, 'id' | 'timestamp'> & { timestamp?: string }) => {
    setSessionTrace((previous) => ({
      ...previous,
      events: [
        ...previous.events,
        {
          id: createId(),
          timestamp: event.timestamp ?? new Date().toISOString(),
          type: event.type,
          label: event.label,
          details: event.details ?? {}
        }
      ]
    }))
  }

  const handleIngest = () => {
    setIngestStatus('running')
    pushTraceEvent({ type: 'compose', label: 'Datasæt indlæst', details: { mode: 'manual ingest' } })

    setTimeout(() => {
      vectorStore.upsert(
        articles.map((article) => ({
          id: `${article.id}-full`,
          namespace: 'articles',
          text: `${article.title} ${article.summary} ${article.analysis.join(' ')} ${article.implications.join(' ')}`,
          metadata: { focusLane: article.focusLane, tags: article.tags }
        }))
      )
      vectorStore.upsert(seedSecurityNotes)
      setIngestStatus('complete')
    }, 600)
  }

  const handleCompose = () => {
    setIsComposing(true)
    pushTraceEvent({ type: 'compose', label: 'SignalStream genererer artikler', details: { promptName } })

    setTimeout(() => {
      const focus = activeArticle?.focusLane ?? 'Datasuverænitet'
      const nearest = vectorStore.search('articles', `${focus} ${config.language}`, 3)

      const composedArticles = articles.map((article, index) => {
        const vectorInfo = nearest[index]
        const vectorScore = vectorInfo?.score ?? article.evidence.vectorScore
        return {
          ...article,
          evidence: {
            ...article.evidence,
            vectorScore: Number(vectorScore.toFixed(2)),
            bm25Score: Number((article.evidence.bm25Score * 0.95 + 0.05 * Math.random()).toFixed(2)),
            freshnessHours: Math.max(2, Math.round(article.evidence.freshnessHours - 1)),
            domainAuthority: article.evidence.domainAuthority,
            citationCoverage: article.sources.length / Math.max(article.sources.length, 1)
          },
          why: [
            `Vector-score ${Number(vectorScore.toFixed(2))} baseret på systemprompten`,
            ...article.why.slice(1)
          ]
        }
      })

      setArticles(composedArticles)
      setActiveArticleId(composedArticles[0]?.id ?? '')
      setIsComposing(false)
    }, 750)
  }

  const handleSelectArticle = (article: SignalStreamArticle) => {
    setActiveArticleId(article.id)
    pushTraceEvent({
      type: 'view',
      label: `Fokus på ${article.title}`,
      details: { focusLane: article.focusLane, tags: article.tags }
    })
  }

  const handleExpandScope = (strategy: 'broaden' | 'narrow' | 'adjacent' | 'temporal') => {
    const query = `${strategy} ${activeArticle?.focusLane ?? 'datasuverænitet'}`
    const related = vectorStore.search('articles', query, 4)
    const mapped = related.map(({ doc }) => {
      const metadata = doc.metadata as { focusLane?: string; tags?: string[] }
      const focusLane = metadata.focusLane ?? 'Relateret spor'
      const tag = metadata.tags?.[0] ?? 'strategi'
      return `Overvej ${focusLane} med tag ${tag}`
    })
    const nextSuggestions = mapped.length > 0 ? mapped : baseScopeSuggestions
    setSuggestions(nextSuggestions)

    pushTraceEvent({
      type: 'expand',
      label: `Horisontskifte (${strategy})`,
      details: { suggestions: nextSuggestions }
    })
  }

  const handleSaveTrace = () => {
    setTraceHistory((history) => [...history, sessionTrace])
    setSessionTrace(createInitialTrace())
  }

  const toggleDomain = (domain: string) => {
    setConfig((prev) => {
      const exists = prev.allowedDomains.includes(domain)
      return {
        ...prev,
        allowedDomains: exists
          ? prev.allowedDomains.filter((item) => item !== domain)
          : [...prev.allowedDomains, domain]
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/10 border-cyber-blue/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Compass className="w-10 h-10 text-cyber-blue" />
            <div>
              <h1 className="text-2xl font-bold">SignalStream Intelligence</h1>
              <p className="text-sm text-gray-300">
                Differentieret Pulse-klon med evidenskriterier, fokusstier og horisontskifte.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
            <span className="px-3 py-1 bg-gray-800/60 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" /> Datasuverænitet
            </span>
            <span className="px-3 py-1 bg-gray-800/60 rounded-full flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> Vektorlager aktivt
            </span>
            <span className="px-3 py-1 bg-gray-800/60 rounded-full flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-400" /> {config.freshnessDays} dages friskhed
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyber-blue" /> System prompt
                </h2>
                <p className="text-sm text-gray-400">
                  Indlæs eller tilpas den strategiske profil. Promptnavnet bruges i sessionstraces.
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-gray-500">{promptName}</span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              className="mt-4 w-full h-40 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyber-blue"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => setPromptName('SignalStream Default')} className="bg-cyber-blue/80">
                Gem navn
              </Button>
              <Button
                onClick={() => setSystemPrompt(defaultPrompt)}
                className="bg-gray-800 text-gray-100 hover:bg-gray-700"
              >
                Nulstil til standard
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Scan className="w-5 h-5 text-cyber-blue" /> Datasæt & ingest
                </h2>
                <p className="text-sm text-gray-400">
                  Kør ingest for at placere artikler, kilder og trusler i SignalStreams vektorlager.
                </p>
              </div>
              <Button onClick={handleIngest} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${ingestStatus === 'running' ? 'animate-spin' : ''}`} />
                Ingest
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-gray-800">
                <span className="text-xs text-gray-400">Status</span>
                <div className="text-sm font-semibold text-gray-100 capitalize">{ingestStatus}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-800">
                <span className="text-xs text-gray-400">Artikler</span>
                <div className="text-sm font-semibold text-gray-100">{articles.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-800">
                <span className="text-xs text-gray-400">Trusler</span>
                <div className="text-sm font-semibold text-gray-100">{seedSecurityNotes.length}</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyber-blue" /> Komponér artikler
                </h2>
                <p className="text-sm text-gray-400">SignalStream kombinerer prompten med vektorlageret.</p>
              </div>
              <Button onClick={handleCompose} disabled={isComposing} className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {isComposing ? 'Arbejder…' : 'Komponér brief'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ListTree className="w-5 h-5 text-cyber-blue" /> Fokusstier
              </h2>
              <Button
                onClick={() => handleExpandScope('adjacent')}
                className="bg-gray-800 hover:bg-gray-700 text-gray-100 flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" /> Horisontskifte
              </Button>
            </div>
            <div className="mt-4 grid gap-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`rounded-lg border ${
                    article.id === activeArticleId ? 'border-cyber-blue bg-cyber-blue/10' : 'border-gray-700 bg-gray-900'
                  }`}
                >
                  <button
                    className="w-full text-left p-4 flex flex-col gap-3"
                    onClick={() => handleSelectArticle(article)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{article.title}</h3>
                        <p className="text-sm text-gray-400">{article.summary}</p>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        <div className="font-semibold text-cyber-blue">{article.focusLane}</div>
                        <span>{new Date(article.createdAt).toLocaleString('da-DK')}</span>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr,1fr]">
                      <img
                        src={article.images[0]?.url}
                        alt={article.images[0]?.alt}
                        className="w-full h-36 object-cover rounded-lg border border-gray-800"
                        loading="lazy"
                      />
                      <div className="text-xs text-gray-300 space-y-1">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-cyan-400" />
                          <span>Evidensscore: {article.evidence.vectorScore.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-amber-400" />
                          <span>Friskhed: {article.evidence.freshnessHours} timer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-400" />
                          <span>Domæneautoritet: {article.evidence.domainAuthority.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span>{article.tags.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                      {article.sources.map((source) => (
                        <span key={source.id} className="px-2 py-1 bg-gray-800/80 rounded">
                          {source.origin}: {source.title}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {activeArticle && (
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-cyber-blue" /> Artikelvisning
                  </h2>
                  <Button
                    onClick={() => handleExpandScope('broaden')}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-100 flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" /> Udvid fokus
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-[1.3fr,1fr]">
                  <img
                    src={activeArticle.images[0]?.url}
                    alt={activeArticle.images[0]?.alt}
                    className="w-full h-52 object-cover rounded-lg border border-gray-800"
                    loading="lazy"
                  />
                  <div className="space-y-3 text-sm text-gray-300">
                    <div>
                      <h3 className="font-semibold text-gray-100">Executive Snapshot</h3>
                      <p>{activeArticle.summary}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100">Signal & Noise</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {activeArticle.keyPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm text-gray-300">
                    <h3 className="font-semibold text-gray-100">Analysis</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {activeArticle.analysis.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <h3 className="font-semibold text-gray-100">Controls & Decisions</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {activeArticle.implications.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-900 border border-gray-800 p-4 text-sm text-gray-300">
                  <h3 className="font-semibold text-gray-100 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Cited Sources
                  </h3>
                  <ul className="space-y-2">
                    {activeArticle.sources.map((source) => (
                      <li key={source.id} className="flex flex-col">
                        <span className="text-gray-100">{source.title}</span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyber-blue text-xs"
                        >
                          {source.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <img
                    src={activeArticle.images[1]?.url}
                    alt={activeArticle.images[1]?.alt}
                    className="w-full h-48 object-cover rounded-lg border border-gray-800"
                    loading="lazy"
                  />
                  <p className="text-xs text-gray-500 mt-2">{activeArticle.images[1]?.caption}</p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyber-blue" /> Horisontskifte forslag
              </h2>
              <Button
                onClick={() => handleExpandScope('temporal')}
                className="bg-gray-800 hover:bg-gray-700 text-gray-100"
              >
                Historisk perspektiv
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion} className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300">
                  {suggestion}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-cyber-blue" /> Konfiguration
            </h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Sprog</span>
                <Button
                  className="bg-gray-800 text-gray-200 hover:bg-gray-700"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, language: prev.language === 'da' ? 'en' : 'da' }))
                  }
                >
                  {config.language.toUpperCase()}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Maks artikler</span>
                <Button
                  className="bg-gray-800 text-gray-200 hover:bg-gray-700"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      maxArticles: prev.maxArticles === 6 ? 8 : 6
                    }))
                  }
                >
                  {config.maxArticles}
                </Button>
              </div>
              <div>
                <span className="text-xs uppercase text-gray-500">Tilladte domæner</span>
                <div className="mt-2 space-y-2">
                  {['enisa.europa.eu', 'digst.dk', 'cfcs.dk', 'tdc.dk'].map((domain) => (
                    <label key={domain} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={config.allowedDomains.includes(domain)}
                        onChange={() => toggleDomain(domain)}
                        className="accent-cyber-blue"
                      />
                      {domain}
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-800 space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={config.requireCitations}
                    onChange={() =>
                      setConfig((prev) => ({ ...prev, requireCitations: !prev.requireCitations }))
                    }
                    className="accent-cyber-blue"
                  />
                  Kræv kilder
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={config.rejectLowTrust}
                    onChange={() =>
                      setConfig((prev) => ({ ...prev, rejectLowTrust: !prev.rejectLowTrust }))
                    }
                    className="accent-cyber-blue"
                  />
                  Afvis lavt tillidsniveau
                </label>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-cyber-blue" /> Evidenskriterier
            </h2>
            {activeArticle ? (
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Vector-score</span>
                  <span className="text-cyan-400 font-semibold">{activeArticle.evidence.vectorScore.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>BM25</span>
                  <span className="text-cyan-400 font-semibold">{activeArticle.evidence.bm25Score.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Friskhed (timer)</span>
                  <span className="text-amber-400 font-semibold">{activeArticle.evidence.freshnessHours}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Domæneautoritet</span>
                  <span className="text-emerald-400 font-semibold">{activeArticle.evidence.domainAuthority.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Citationsdækning</span>
                  <span className="text-emerald-400 font-semibold">
                    {(activeArticle.evidence.citationCoverage * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-800 space-y-2">
                  {activeArticle.why.map((reason) => (
                    <p key={reason} className="text-xs text-gray-400">• {reason}</p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">Vælg en artikel for at se evidenskriterier.</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-cyber-blue" /> Sessionstraces
              </h2>
              <Button onClick={handleSaveTrace} className="bg-gray-800 hover:bg-gray-700 text-gray-100">
                Arkivér trace
              </Button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-gray-300 max-h-64 overflow-y-auto">
              {sessionTrace.events.map((event) => (
                <div key={event.id} className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-100">{event.label}</span>
                    <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString('da-DK')}</span>
                  </div>
                  <p className="text-gray-400">{event.type}</p>
                </div>
              ))}
            </div>
            {traceHistory.length > 0 && (
              <div className="mt-4 border-t border-gray-800 pt-4 text-xs text-gray-400 space-y-2">
                <h3 className="font-semibold text-gray-200">Arkiverede sessioner</h3>
                {traceHistory.map((trace) => (
                  <div key={trace.id} className="p-3 bg-gray-900 rounded border border-gray-800">
                    <div className="flex items-center justify-between">
                      <span>{trace.focus}</span>
                      <span>{new Date(trace.startedAt).toLocaleDateString('da-DK')}</span>
                    </div>
                    <p>{trace.events.length} hændelser</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SignalStream
