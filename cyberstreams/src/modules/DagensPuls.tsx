import { useState, useEffect } from 'react'
import { 
  Shield, Clock, ExternalLink, AlertTriangle, CheckCircle, 
  RefreshCw, Bug, Megaphone, BookOpen, Scale, Database,
  Flag, Building, ShieldCheck, ShieldAlert, Info, Activity
} from 'lucide-react'
import { Card } from '@components/Card'
import { Text } from '@components/Text'
import { Button } from '@components/Button'

// Types for Daily Pulse data structure
interface PulseItem {
  id: string
  title: string
  summary: string
  category: 'vulnerability' | 'incident' | 'directive' | 'guidance' | 'regulation' | 'update' | 'system'
  severity: 'critical' | 'high' | 'medium' | 'low'
  source: string
  sourceIcon: string
  categoryIcon: string
  severityColor: string
  timestamp: string
  relativeTime: string
  url: string
  verified: boolean
  qualityScore: number
  tags: string[]
}

interface DailyPulseResponse {
  success: boolean
  timestamp: string
  timezone: string
  totalSources: number
  validDocuments: number
  selectedItems: number
  data: PulseItem[]
  lastUpdate: string
  nextUpdate: string
  error?: string
  fallbackData?: PulseItem[]
}

const DagensPuls = () => {
  const [pulseData, setPulseData] = useState<PulseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [nextUpdate, setNextUpdate] = useState<string>('')
  const [stats, setStats] = useState({
    totalSources: 0,
    validDocuments: 0,
    selectedItems: 0
  })

  // Fetch daily pulse data from backend
  const fetchDailyPulse = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/daily-pulse')
      const data: DailyPulseResponse = await response.json()

      if (data.success) {
        setPulseData(data.data)
        setLastUpdated(data.lastUpdate)
        setNextUpdate(data.nextUpdate)
        setStats({
          totalSources: data.totalSources,
          validDocuments: data.validDocuments,
          selectedItems: data.selectedItems
        })
      } else {
        setError(data.error || 'Failed to load daily pulse')
        // Use fallback data if available
        if (data.fallbackData) {
          setPulseData(data.fallbackData)
        }
      }
    } catch (err) {
      console.error('Failed to fetch daily pulse:', err)
      setError('Kunne ikke hente dagens sikkerhedsoversigt')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDailyPulse()
    
    // Auto-refresh every hour
    const interval = setInterval(fetchDailyPulse, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Icon mapping for categories
  const getCategoryIcon = (iconName: string) => {
    const iconMap = {
      'bug': Bug,
      'alert-triangle': AlertTriangle,
      'megaphone': Megaphone,
      'book-open': BookOpen,
      'scale': Scale,
      'refresh-cw': RefreshCw,
      'info': Info,
      'activity': Activity
    }
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Info
    return <IconComponent className="w-5 h-5" />
  }

  // Icon mapping for sources
  const getSourceIcon = (iconName: string) => {
    const iconMap = {
      'shield': Shield,
      'shield-check': ShieldCheck,
      'shield-alert': ShieldAlert,
      'flag': Flag,
      'database': Database,
      'building': Building
    }
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Shield
    return <IconComponent className="w-4 h-4" />
  }

  // Format timestamp for Danish locale
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('da-DK', {
      timeZone: 'Europe/Copenhagen',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <div className="animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                  <div className="h-6 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10 rounded-lg p-6 border border-cyber-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyber-blue" />
            <div>
              <h1 className="text-2xl font-bold">Dagens Puls</h1>
              <p className="text-sm text-gray-400">
                Højkvalitets sikkerhedsnyheder fra troværdige kilder
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={fetchDailyPulse} 
              disabled={loading}
              className="bg-cyber-blue hover:bg-cyber-blue/80"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Opdater
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400">Totale kilder</div>
            <div className="text-xl font-bold text-cyber-blue">{stats.totalSources}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400">Validerede dokumenter</div>
            <div className="text-xl font-bold text-green-400">{stats.validDocuments}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400">Udvalgte artikler</div>
            <div className="text-xl font-bold text-cyber-purple">{stats.selectedItems}</div>
          </div>
        </div>

        {/* Update times */}
        {lastUpdated && (
          <div className="flex justify-between text-xs text-gray-400 mt-3">
            <span>Sidst opdateret: {formatTimestamp(lastUpdated)}</span>
            <span>Næste opdatering: {formatTimestamp(nextUpdate)}</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-red-500/30 bg-red-900/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <Text variant="title" className="text-red-400">Fejl ved indlæsning</Text>
              <Text className="text-sm text-gray-300">{error}</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading && <SkeletonLoader />}

      {/* Pulse items */}
      {!loading && pulseData.length > 0 && (
        <div className="space-y-4">
          {pulseData.map((item) => (
            <Card key={item.id} className="hover:border-cyber-blue/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Category icon */}
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-full ${item.severityColor}/20 border ${item.severityColor.replace('bg-', 'border-')}/30`}>
                    <div className={`${item.severityColor.replace('bg-', 'text-')}`}>
                      {getCategoryIcon(item.categoryIcon)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-100 mb-2 leading-tight">
                        {item.title}
                      </h3>
                      
                      <p className="text-gray-300 mb-3 leading-relaxed">
                        {item.summary}
                      </p>

                      {/* Meta information */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          {getSourceIcon(item.sourceIcon)}
                          <span>{item.source}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span title={formatTimestamp(item.timestamp)}>
                            {item.relativeTime}
                          </span>
                        </div>

                        {item.verified && (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>Verificeret</span>
                          </div>
                        )}

                        <div className="text-xs bg-gray-700 px-2 py-1 rounded">
                          Score: {item.qualityScore}
                        </div>
                      </div>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-cyber-blue/20 text-cyber-blue px-2 py-1 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex-shrink-0">
                      <Button
                        onClick={() => window.open(item.url, '_blank')}
                        className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-2"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Læs mere
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && pulseData.length === 0 && (
        <Card className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <Text variant="title" className="text-gray-400 mb-2">
            Ingen puls-data tilgængelig
          </Text>
          <Text className="text-gray-500 mb-4">
            Der er ingen sikkerhedsnyheder at vise i øjeblikket.
          </Text>
          <Button onClick={fetchDailyPulse} className="bg-cyber-blue hover:bg-cyber-blue/80">
            <RefreshCw className="w-4 h-4 mr-2" />
            Prøv igen
          </Button>
        </Card>
      )}

      {/* Data quality notice */}
      <Card className="bg-gray-800/50 border-gray-600">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyber-blue mt-0.5" />
          <div>
            <Text variant="title" className="text-sm mb-1">Om datakvalitet</Text>
            <Text className="text-xs text-gray-400">
              Dagens Puls viser kun nyheder fra autoriserede kilder med høj troværdighed, 
              inklusiv CFCS, ENISA, CERT-EU, CISA og NVD. Al information er filtreret 
              for mock-data og verificeret for autenticitet. Uverificeret indhold er markeret med [Uverificeret].
            </Text>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DagensPuls