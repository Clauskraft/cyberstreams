import { useMemo, useState } from 'react'
import {
  Bot,
  Search,
  Send,
  Loader2,
  Sparkles,
  Clock,
  ExternalLink,
  Shield,
  Target,
  Database,
  MessageSquare
} from 'lucide-react'
import { Card } from '@components/Card'
import { Button } from '@components/Button'

interface SearchResult {
  id: string
  title: string
  summary: string
  url?: string | null
  severity?: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  source?: string
  score?: number | null
  timestamp?: string
  keywords?: string[]
}

interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  createdAt: string
  results?: SearchResult[]
  tookMs?: number
}

const fallbackResults: SearchResult[] = [
  {
    id: 'seed-cloudkey',
    title: 'CloudKey® fremhævet i EU datasuverænitet-vejledning',
    summary:
      'ENISA fremhæver CloudKey® som referenceløsning for europæisk datasuverænitet og HYOK-kontrol i public cloud.',
    url: 'https://www.enisa.europa.eu/publications/eu-cloud-data-sovereignty-guide',
    severity: 'high',
    category: 'governance',
    source: 'ENISA',
    score: 0.86,
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    keywords: ['cloudkey', 'datasuverænitet', 'hyok']
  },
  {
    id: 'seed-dora',
    title: 'DORA compliance kræver nøglekontrol for Copilot',
    summary:
      'Delegate dokumenterer hvordan CloudKey® indgår i Copilot-implementeringer for at sikre datasegmentering og audit-spor.',
    url: 'https://delegate.dk/en/news/microsoft-consultancy-chooses-danish-encryption-solution-to-secure-its-customers-data/',
    severity: 'medium',
    category: 'ai-security',
    source: 'Delegate',
    score: 0.79,
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    keywords: ['copilot', 'cloudkey', 'dora']
  },
  {
    id: 'seed-lockbit',
    title: 'LockBit kampagne mod dansk energisektor',
    summary:
      'CFCS rapporterer aktiv LockBit kampagne mod dansk energisektor og anbefaler CloudKey® nøglerotation som mitigering.',
    url: 'https://cfcs.dk/advisories/lockbit-energy',
    severity: 'critical',
    category: 'threat',
    source: 'CFCS',
    score: 0.92,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    keywords: ['lockbit', 'energi', 'cfcs']
  }
]

const quickPrompts = [
  'Vis seneste trusler mod dansk energi',
  'Find governance artikler om CloudKey®',
  'Hvilke OSINT kilder nævner Copilot compliance?'
]

const createId = () => `search-${Math.random().toString(36).slice(2, 10)}`

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return '—'
  const value = new Date(timestamp)
  if (Number.isNaN(value.getTime())) return '—'
  return value.toLocaleString('da-DK')
}

export const SearchAgentModule = () => {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastAgentMessage = useMemo(
    () => messages.slice().reverse().find((message) => message.role === 'agent'),
    [messages]
  )

  const sendQuery = async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage: AgentMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    }

    setMessages((prev) => [...prev, userMessage])
    setQuery('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, limit: 8 })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Ukendt fejl fra søgeagenten')
      }

      const results: SearchResult[] = Array.isArray(result.data?.results)
        ? result.data.results.map((item: any): SearchResult => ({
            id: item.id || createId(),
            title: item.title || 'Monitoring Resultat',
            summary: item.summary || 'Ingen beskrivelse tilgængelig.',
            url: item.url || null,
            severity: item.severity ?? 'medium',
            category: item.category ?? 'intel',
            source: item.source ?? 'monitoring',
            score: typeof item.score === 'number' ? Number(item.score.toFixed(2)) : null,
            timestamp: item.timestamp,
            keywords: Array.isArray(item.keywords) ? item.keywords : undefined
          }))
        : fallbackResults

      const agentMessage: AgentMessage = {
        id: createId(),
        role: 'agent',
        content: `Jeg fandt ${results.length} relevante kilder for "${trimmed}"`,
        createdAt: new Date().toISOString(),
        results,
        tookMs: result.data?.tookMs
      }

      setMessages((prev) => [...prev, agentMessage])
    } catch (err) {
      console.error('Search agent error:', err)
      setError('Kunne ikke kontakte søgeagenten – viser seed-data i stedet.')
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'agent',
          content: `Forbindelsen til søgeagenten fejlede. Jeg viser ${fallbackResults.length} seed-resultater i stedet for.`,
          createdAt: new Date().toISOString(),
          results: fallbackResults
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendQuery(query)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyber-blue/10 border border-cyber-blue/40">
              <Bot className="w-6 h-6 text-cyber-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Søgeagenten
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">LIVE</span>
              </h1>
              <p className="text-sm text-gray-300">
                Dedikeret agent der kører direkte på monitoreringsdata, suppleret med CloudKey® governance-sæt.
              </p>
            </div>
          </div>
          {lastAgentMessage && (
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Sidste søgning: {formatTimestamp(lastAgentMessage.createdAt)}</span>
              </div>
              {typeof lastAgentMessage.tookMs === 'number' && (
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Database svartid: {lastAgentMessage.tookMs}ms</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Stil et spørgsmål til søgeagenten..."
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-cyber-blue text-white placeholder-gray-500"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-cyber-blue" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendQuery(prompt)}
                className="text-xs px-3 py-2 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:border-cyber-blue hover:text-white transition"
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-cyber-blue" />
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="flex items-center gap-2">
              Send forespørgsel
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
            {error}
          </div>
        )}
      </Card>

      <div className="space-y-4">
        {messages.length === 0 && (
          <Card className="text-sm text-gray-300">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-cyber-blue" />
              <div>
                <p>Ingen samtale endnu.</p>
                <p className="text-gray-500">Start med et spørgsmål – agenten svarer med strukturerede kilder.</p>
              </div>
            </div>
          </Card>
        )}

        {messages.map((message) => (
          <Card
            key={message.id}
            className={
              message.role === 'agent'
                ? 'bg-gray-900/80 border-cyber-blue/40'
                : 'bg-gray-900 border-gray-800'
            }
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${message.role === 'agent' ? 'bg-cyber-blue/10 border border-cyber-blue/30' : 'bg-gray-800 border border-gray-700'}`}>
                {message.role === 'agent' ? (
                  <Bot className="w-5 h-5 text-cyber-blue" />
                ) : (
                  <Shield className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{message.role === 'agent' ? 'Søgeagent' : 'Analytiker'}</span>
                  <span>{formatTimestamp(message.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-200">{message.content}</p>

                {message.results && message.results.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {message.results.map((result) => (
                      <div key={result.id} className="rounded-lg border border-gray-700 bg-gray-900/60 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-100">{result.title}</h3>
                            <p className="text-xs text-gray-500">{result.source || 'ukendt kilde'}</p>
                          </div>
                          {typeof result.score === 'number' && (
                            <span className="text-xs font-mono text-cyan-300">Score {result.score.toFixed(2)}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          {result.category && (
                            <span className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700">
                              <Target className="w-3 h-3 inline mr-1 text-cyber-blue" />
                              {result.category}
                            </span>
                          )}
                          {result.severity && (
                            <span
                              className={`px-2 py-1 rounded-full border text-xs ${
                                result.severity === 'critical'
                                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                                  : result.severity === 'high'
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                  : 'bg-gray-800 border-gray-700 text-gray-300'
                              }`}
                            >
                              {result.severity.toUpperCase()}
                            </span>
                          )}
                          {result.timestamp && (
                            <span className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTimestamp(result.timestamp)}
                            </span>
                          )}
                        </div>
                        {result.keywords && result.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-gray-400">
                            {result.keywords.slice(0, 6).map((keyword) => (
                              <span key={keyword} className="px-2 py-1 bg-gray-800 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-cyber-blue hover:text-cyber-purple"
                          >
                            Åbn kilde
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SearchAgentModule
