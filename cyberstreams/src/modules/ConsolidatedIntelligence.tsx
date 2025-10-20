import { useState } from 'react'
import {
  Search, AlertTriangle,
  Globe, Database, Clock, Users, Activity, Eye,
  Target, Zap, BarChart3, PieChart, Network
} from 'lucide-react'
import NoData from '@components/NoData'

interface ThreatFinding {
  id: string
  timestamp: string
  title: string
  description: string
  source: string
  sourceType: 'rss' | 'osint' | 'social' | 'technical'
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string[]
  indicators: {
    type: string
    value: string
  }[]
  correlations?: string[]
  confidence: number
  link?: string
}

const ConsolidatedIntelligence = () => {
  const [findings] = useState<ThreatFinding[]>([])
  const [loading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterCategory] = useState<string>('all')
  const [timeRange, setTimeRange] = useState('24h')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    }
  }

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'rss': return Globe
      case 'osint': return Eye
      case 'social': return Users
      case 'technical': return Database
      default: return Activity
    }
  }

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = searchQuery === '' ||
      finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.category.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSeverity = filterSeverity === 'all' || finding.severity === filterSeverity
    const matchesSource = filterSource === 'all' || finding.sourceType === filterSource
    const matchesCategory = filterCategory === 'all' || finding.category.includes(filterCategory)

    return matchesSearch && matchesSeverity && matchesSource && matchesCategory
  })

  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    sources: Array.from(new Set(findings.map(f => f.source))).length,
    avgConfidence: findings.length === 0 ? 0 : Math.round(findings.reduce((acc, f) => acc + f.confidence, 0) / findings.length)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10 rounded-lg p-6 border border-cyber-blue/30">
        <div className="flex items-center gap-3 mb-3">
          <Network className="w-8 h-8 text-cyber-blue" />
          <div>
            <h1 className="text-2xl font-bold">Consolidated Intelligence</h1>
            <p className="text-sm text-gray-400">Unified threat intelligence across all sources with AI-powered correlation</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">Powered by: OpenSearch + Grafana + MISP + OpenCTI</span>
          <span className="text-cyber-blue">• Open Source Intelligence Platform</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Findings</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Database className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
            </div>
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Sources</p>
              <p className="text-2xl font-bold">{stats.sources}</p>
            </div>
            <Globe className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.avgConfidence}%</p>
            </div>
            <Target className="w-8 h-8 text-cyan-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search findings, indicators, categories... (AI-powered)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyber-blue text-white placeholder-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyber-blue"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyber-blue"
            >
              <option value="all">All Sources</option>
              <option value="rss">RSS Feeds</option>
              <option value="osint">OSINT</option>
              <option value="social">Social Intel</option>
              <option value="technical">Technical</option>
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyber-blue"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Intelligence Findings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Intelligence Findings ({filteredFindings.length})</h2>
          <button className="px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 rounded-lg text-sm font-medium transition-all">
            Export Report
          </button>
        </div>

        {filteredFindings.map((finding) => {
          const SourceIcon = getSourceTypeIcon(finding.sourceType)
          return (
            <div
              key={finding.id}
              className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center ${getSeverityColor(finding.severity)}`}>
                  <SourceIcon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-gray-500">{finding.id}</span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(finding.severity)}`}>
                          {finding.severity.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
                          {finding.sourceType.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {finding.confidence}% confidence
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{finding.title}</h3>
                      <p className="text-sm text-gray-400 mb-3">{finding.description}</p>

                      {/* Categories */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {finding.category.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      {/* Indicators */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Indicators of Compromise:</p>
                        <div className="flex flex-wrap gap-2">
                          {finding.indicators.map((indicator, idx) => (
                            <code
                              key={idx}
                              className="text-xs px-2 py-1 bg-gray-800 text-cyber-blue rounded border border-gray-700 font-mono"
                            >
                              {indicator.type}: {indicator.value}
                            </code>
                          ))}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {finding.link ? (
                            <a
                              href={finding.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyber-blue hover:text-cyber-blue/80 underline cursor-pointer"
                            >
                              {finding.source}
                            </a>
                          ) : (
                            <span className="cursor-pointer text-gray-300 hover:text-white"
                                  title="Click to search for source">
                              {finding.source}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {finding.timestamp}
                        </span>
                        {finding.correlations && finding.correlations.length > 0 && (
                          <span className="flex items-center gap-1 text-cyber-blue">
                            <Network className="w-3 h-3" />
                            {finding.correlations.length} correlations
                          </span>
                        )}
                      </div>
                    </div>

                    {finding.link && (
                      <a
                        href={finding.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium transition-all"
                      >
                        View Source →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredFindings.length === 0 && (
        <NoData title="Ingen data" message="Ingen data at vise endnu." />
      )}
    </div>
  )
}

export default ConsolidatedIntelligence
