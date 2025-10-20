import React, { useState, useEffect, useCallback } from 'react'
import {
  Bot,
  Brain,
  Zap,
  Eye,
  Activity,
  Clock,
  Shield,
  Globe,
  Database,
  Target,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface IntelControlPanelProps {
  className?: string
}

interface ScraperMetrics {
  totalRuns: number
  failedRuns: number
  totalDocumentsProcessed: number
  lastDocumentCount: number
  lastDurationMs: number
  averageDocumentsPerRun: number
  successRate: number
  uptimeSeconds: number
}

interface RecentActivity {
  id: string
  timestamp: string
  action: string
  status: 'success' | 'warning' | 'error' | 'pending'
  details: string
}

interface ScraperStatus {
  isRunning: boolean
  lastActivity: string | null
  activeSources: number
  totalSources: number
  activeJobs: number
  pendingApprovals: number
  complianceEnabled: boolean
  emergencyBypass: boolean
  nextRun?: string | null
  lastRunAt?: string | null
  lastError?: string | null
  metrics: ScraperMetrics
  activity: RecentActivity[]
}

const DEFAULT_METRICS: ScraperMetrics = {
  totalRuns: 0,
  failedRuns: 0,
  totalDocumentsProcessed: 0,
  lastDocumentCount: 0,
  lastDurationMs: 0,
  averageDocumentsPerRun: 0,
  successRate: 100,
  uptimeSeconds: 0
}

const DEFAULT_STATUS: ScraperStatus = {
  isRunning: false,
  lastActivity: null,
  activeSources: 0,
  totalSources: 0,
  activeJobs: 0,
  pendingApprovals: 0,
  complianceEnabled: true,
  emergencyBypass: false,
  nextRun: null,
  lastRunAt: null,
  lastError: null,
  metrics: DEFAULT_METRICS,
  activity: []
}

function formatRelativeTime(timestamp?: string | null) {
  if (!timestamp) {
    return 'N/A'
  }

  const time = new Date(timestamp).getTime()
  if (Number.isNaN(time)) {
    return 'N/A'
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - time) / 1000))

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  }
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60)
    return `${minutes}m ago`
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600)
    return `${hours}h ago`
  }
  const days = Math.floor(diffSeconds / 86400)
  return `${days}d ago`
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '—'
  }
  if (ms < 1000) {
    return `${ms} ms`
  }
  const seconds = ms / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(1)} s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

function formatUptime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Offline'
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

const IntelControlPanel: React.FC<IntelControlPanelProps> = ({ className = '' }) => {
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus>(DEFAULT_STATUS)
  const [metrics, setMetrics] = useState<ScraperMetrics>(DEFAULT_METRICS)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  const applyStatusUpdate = useCallback((data: any) => {
    const mergedStatus: ScraperStatus = {
      ...DEFAULT_STATUS,
      ...data,
      metrics: { ...DEFAULT_METRICS, ...(data?.metrics || {}) },
      activity: data?.activity || []
    }
    setScraperStatus(mergedStatus)
    setMetrics(mergedStatus.metrics)
    setRecentActivity(mergedStatus.activity)
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/intel-scraper/status')
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      const result = await response.json()
      if (result.success) {
        applyStatusUpdate(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch Intel Scraper status:', error)
    }
  }, [applyStatusUpdate])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleToggleScraper = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const endpoint = scraperStatus.isRunning ? '/api/intel-scraper/stop' : '/api/intel-scraper/start'
      const response = await fetch(endpoint, { method: 'POST' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to toggle scraper')
      }

      applyStatusUpdate(result.data)
      setMessage({ type: 'success', text: result.message || 'Intel Scraper status opdateret' })
    } catch (error) {
      console.error('Failed to toggle scraper:', error)
      setMessage({ type: 'error', text: 'Kunne ikke opdatere Intel Scraper status' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyBypass = async () => {
    if (!confirm('⚠️ ADVARSEL: Emergency bypass vil deaktivere alle compliance checks i 1 time. Fortsæt?')) {
      return
    }

    setIsLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/intel-scraper/emergency-bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual activation from control panel' })
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to enable emergency bypass')
      }

      applyStatusUpdate(result.data)
      setMessage({ type: 'warning', text: result.message || 'Emergency bypass aktiveret' })
    } catch (error) {
      console.error('Failed to enable emergency bypass:', error)
      setMessage({ type: 'error', text: 'Kunne ikke aktivere emergency bypass' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceRefresh = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/intel-scraper/run', { method: 'POST' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to execute manual run')
      }

      applyStatusUpdate(result.data)
      setMessage({ type: 'success', text: result.message || 'Manuel kørsel gennemført' })
    } catch (error) {
      console.error('Failed to refresh:', error)
      setMessage({ type: 'error', text: 'Kunne ikke gennemføre manuel kørsel' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10 rounded-lg p-6 border border-cyber-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-cyber-blue" />
            <div>
              <h2 className="text-2xl font-bold">Intel Control Panel</h2>
              <p className="text-sm text-gray-400">Real-time monitoring og kontrol af Intel Scraper</p>
            </div>
          </div>

          {scraperStatus.emergencyBypass && (
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold animate-pulse">
              🚨 EMERGENCY BYPASS ACTIVE
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : message.type === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}
        >
          {message.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-sm underline">
            Luk
          </button>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Status */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-cyber-blue" />
            <h3 className="text-lg font-semibold">System Status</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Scraper Status:</span>
              <span className={`font-bold ${scraperStatus.isRunning ? 'text-green-400' : 'text-gray-400'}`}>
                {scraperStatus.isRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Sources:</span>
              <span className="font-bold text-cyber-blue">{scraperStatus.activeSources}/{scraperStatus.totalSources}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Jobs:</span>
              <span className="font-bold text-yellow-400">{scraperStatus.activeJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Compliance:</span>
              <span className={`font-bold ${scraperStatus.complianceEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {scraperStatus.complianceEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Sidste kørsel:</span>
              <span className="font-semibold text-gray-200">{formatRelativeTime(scraperStatus.lastRunAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Næste planlagte kørsel:</span>
              <span className="text-gray-300">{formatRelativeTime(scraperStatus.nextRun)}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-cyber-purple" />
            <h3 className="text-lg font-semibold">Performance</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Documents:</span>
              <span className="font-bold text-cyber-purple">{metrics.totalDocumentsProcessed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Sidste run (docs):</span>
              <span className="font-bold text-cyber-purple">{metrics.lastDocumentCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Gns. per run:</span>
              <span className="font-bold text-cyber-purple">{metrics.averageDocumentsPerRun}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Success Rate:</span>
              <span className="font-bold text-green-400">{metrics.successRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Varighed (sidste run):</span>
              <span className="font-bold text-yellow-400">{formatDuration(metrics.lastDurationMs)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Uptime:</span>
              <span className="font-bold text-cyber-blue">{formatUptime(metrics.uptimeSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Compliance & Approvals */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Compliance & Approvals</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pending Approvals:</span>
              <span className="font-bold text-yellow-400">{scraperStatus.pendingApprovals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Failed Runs:</span>
              <span className="font-bold text-red-400">{metrics.failedRuns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Emergency Bypass:</span>
              <span className={`font-bold ${scraperStatus.emergencyBypass ? 'text-red-400' : 'text-green-400'}`}>
                {scraperStatus.emergencyBypass ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Sidste aktivitet:</span>
              <span className="font-bold text-gray-300">{formatRelativeTime(scraperStatus.lastActivity)}</span>
            </div>
            {scraperStatus.lastError && (
              <div className="text-sm text-red-400">Seneste fejl: {scraperStatus.lastError}</div>
            )}
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-gray-300" />
          <h3 className="text-lg font-semibold">Kontrolhandlinger</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleToggleScraper}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
              scraperStatus.isRunning
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={isLoading}
          >
            {scraperStatus.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{scraperStatus.isRunning ? 'Stop Scraper' : 'Start Scraper'}</span>
          </button>

          <button
            onClick={handleForceRefresh}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Force Refresh</span>
          </button>

          <button
            onClick={handleEmergencyBypass}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-red-700 hover:bg-red-800 transition-colors"
            disabled={isLoading || scraperStatus.emergencyBypass}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Bypass</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Coverage */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-cyber-blue" />
            <h3 className="text-lg font-semibold">Source Coverage</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <p className="text-gray-400">Aktive kilder</p>
              <p className="text-xl font-bold">{scraperStatus.activeSources}</p>
            </div>
            <div>
              <p className="text-gray-400">Samlede kilder</p>
              <p className="text-xl font-bold">{scraperStatus.totalSources}</p>
            </div>
            <div>
              <p className="text-gray-400">Total runs</p>
              <p className="text-xl font-bold">{metrics.totalRuns}</p>
            </div>
            <div>
              <p className="text-gray-400">Fejl</p>
              <p className="text-xl font-bold text-red-400">{metrics.failedRuns}</p>
            </div>
          </div>
        </div>

        {/* Resource Usage Placeholder */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-cyber-purple" />
            <h3 className="text-lg font-semibold">Ydelsesmålinger</h3>
          </div>
          <p className="text-sm text-gray-400">
            Integrer med overvågningssystem for CPU, hukommelse og netværk for at få fuldt overblik over ressourceforbrug.
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-cyber-blue" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>

        <div className="space-y-3">
          {recentActivity.length === 0 && (
            <div className="text-sm text-gray-500">Ingen aktivitet registreret endnu.</div>
          )}
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className={`rounded-lg border p-4 ${
                activity.status === 'success'
                  ? 'border-green-500/30 bg-green-500/5'
                  : activity.status === 'warning'
                  ? 'border-yellow-500/30 bg-yellow-500/5'
                  : activity.status === 'pending'
                  ? 'border-cyber-blue/30 bg-cyber-blue/5'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">{activity.action}</div>
                <div className="text-sm text-gray-400">{formatRelativeTime(activity.timestamp)}</div>
              </div>
              <p className="text-sm text-gray-300 mt-2">{activity.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default IntelControlPanel
