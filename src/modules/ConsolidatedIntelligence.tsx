import { useState, useEffect } from 'react'
import {
  Search, Filter, AlertTriangle,
  Globe, Database, Clock, Users, Activity, Eye,
  Target, Zap, BarChart3, PieChart, Network
} from 'lucide-react'

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
  const [findings, setFindings] = useState<ThreatFinding[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterCategory] = useState<string>('all')
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    // Mock consolidated intelligence data
    const mockFindings: ThreatFinding[] = [
      {
        id: 'INTEL-001',
        timestamp: '2 minutes ago',
        title: 'Russian APT28 Campaign Targeting Nordic Critical Infrastructure',
        description: 'Multiple indicators suggest coordinated cyber espionage campaign targeting energy and maritime sectors across Nordic countries. Correlates with CERT-DK alert and NATO CCDCOE intelligence.',
        source: 'FE-DDIS + CERT.DK + NATO',
        sourceType: 'osint',
        severity: 'critical',
        category: ['APT', 'Critical Infrastructure', 'Espionage', 'Russia'],
        indicators: [
          { type: 'IP', value: '185.220.101.45' },
          { type: 'Domain', value: 'maritime-update[.]com' },
          { type: 'Hash', value: 'a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4' }
        ],
        correlations: ['INTEL-002', 'INTEL-007'],
        confidence: 95,
        link: 'https://fe-ddis.dk/analysis/apt28-nordic'
      },
      {
        id: 'INTEL-002',
        timestamp: '15 minutes ago',
        title: 'EU FIMI Detection: Coordinated Disinformation on Energy Crisis',
        description: 'Foreign Information Manipulation campaign detected across social media platforms spreading false narratives about EU energy security. Linked to known Russian influence operations.',
        source: 'EEAS + ENISA',
        sourceType: 'social',
        severity: 'high',
        category: ['FIMI', 'Disinformation', 'Energy', 'Influence Operations'],
        indicators: [
          { type: 'Account', value: '@energy_truth_eu' },
          { type: 'Hashtag', value: '#EUEnergyCrisis' },
          { type: 'Domain', value: 'eu-energy-facts[.]info' }
        ],
        correlations: ['INTEL-001'],
        confidence: 87,
        link: 'https://eeas.europa.eu/fimi-alert'
      },
      {
        id: 'INTEL-003',
        timestamp: '32 minutes ago',
        title: 'Zero-Day Vulnerability in Maritime Communication Systems',
        description: 'CISA alert on critical vulnerability in VSAT maritime communication systems. Actively exploited. Danish Maritime Authority notified.',
        source: 'CISA + Maritime Denmark',
        sourceType: 'technical',
        severity: 'critical',
        category: ['Vulnerability', 'Maritime', 'Zero-Day', 'Critical Infrastructure'],
        indicators: [
          { type: 'CVE', value: 'CVE-2025-XXXX' },
          { type: 'Product', value: 'VSAT-CommSys v4.2' },
          { type: 'Exploit', value: 'exploit-db-id-51234' }
        ],
        confidence: 98,
        link: 'https://www.cisa.gov/alerts'
      },
      {
        id: 'INTEL-004',
        timestamp: '1 hour ago',
        title: 'NATO Intelligence: Chinese Cyber Espionage in Defense Sector',
        description: 'NATO CCDCOE reports increased targeting of defense contractors across Allied nations. Focus on R&D and supply chain vulnerabilities.',
        source: 'NATO CCDCOE',
        sourceType: 'osint',
        severity: 'high',
        category: ['APT', 'Defense', 'China', 'Supply Chain'],
        indicators: [
          { type: 'Actor', value: 'APT41' },
          { type: 'TTP', value: 'T1566.001 - Spearphishing Attachment' },
          { type: 'TTP', value: 'T1195.002 - Supply Chain Compromise' }
        ],
        confidence: 92,
        link: 'https://www.nato.int/ccdcoe'
      },
      {
        id: 'INTEL-005',
        timestamp: '2 hours ago',
        title: 'Ransomware Campaign Targeting Danish Healthcare Sector',
        description: 'Multiple Danish hospitals reported ransomware attempts. Pattern matches international LockBit 3.0 campaign. CERT-DK coordinating response.',
        source: 'CERT.DK + Shadowserver',
        sourceType: 'technical',
        severity: 'critical',
        category: ['Ransomware', 'Healthcare', 'Denmark', 'Critical Infrastructure'],
        indicators: [
          { type: 'Malware', value: 'LockBit 3.0' },
          { type: 'IP', value: '203.0.113.42' },
          { type: 'C2', value: 'lockbit-c2[.]onion' }
        ],
        correlations: ['INTEL-008'],
        confidence: 96,
        link: 'https://cert.dk/alerts'
      },
      {
        id: 'INTEL-006',
        timestamp: '3 hours ago',
        title: 'CEPA Analysis: Russian Hybrid Warfare Tactics in Baltic Region',
        description: 'Center for European Policy Analysis reports escalation of hybrid warfare tactics including cyber operations, disinformation, and GPS jamming in Baltic states.',
        source: 'CEPA + RAND Corporation',
        sourceType: 'osint',
        severity: 'high',
        category: ['Hybrid Warfare', 'Baltic', 'Russia', 'GPS'],
        indicators: [
          { type: 'Region', value: 'Baltic Sea' },
          { type: 'Activity', value: 'GPS Jamming' },
          { type: 'Actor', value: 'Russian Armed Forces' }
        ],
        confidence: 89,
        link: 'https://www.cepa.org'
      },
      {
        id: 'INTEL-007',
        timestamp: '4 hours ago',
        title: 'Europol Warning: Cybercrime-as-a-Service Platforms Expansion',
        description: 'Europol identifies new cybercrime marketplace offering DDoS, ransomware, and credential theft services. Significant threat to European businesses.',
        source: 'Europol',
        sourceType: 'technical',
        severity: 'high',
        category: ['Cybercrime', 'Marketplace', 'DDoS', 'Ransomware'],
        indicators: [
          { type: 'Marketplace', value: 'darkmarket[.]onion' },
          { type: 'Service', value: 'DDoS-for-hire' },
          { type: 'Service', value: 'Ransomware-as-a-Service' }
        ],
        correlations: ['INTEL-005'],
        confidence: 91,
        link: 'https://www.europol.europa.eu'
      },
      {
        id: 'INTEL-008',
        timestamp: '5 hours ago',
        title: 'DR Investigation: Cyber Threats to Danish Critical Infrastructure',
        description: 'Danish media reports on increased cyber threat levels targeting energy, water, and transportation infrastructure. Government response measures implemented.',
        source: 'DR Nyheder',
        sourceType: 'rss',
        severity: 'medium',
        category: ['Critical Infrastructure', 'Denmark', 'Policy'],
        indicators: [
          { type: 'Sector', value: 'Energy' },
          { type: 'Sector', value: 'Water' },
          { type: 'Sector', value: 'Transportation' }
        ],
        confidence: 78,
        link: 'https://www.dr.dk/nyheder'
      },
      {
        id: 'INTEL-009',
        timestamp: '6 hours ago',
        title: 'ENISA Report: Emerging AI-Powered Cyber Threats',
        description: 'European cybersecurity agency warns about sophisticated AI-generated phishing campaigns and deepfake-enhanced social engineering attacks.',
        source: 'ENISA',
        sourceType: 'osint',
        severity: 'medium',
        category: ['AI', 'Phishing', 'Social Engineering', 'Emerging Threats'],
        indicators: [
          { type: 'TTP', value: 'AI-Generated Phishing' },
          { type: 'TTP', value: 'Deepfake Social Engineering' }
        ],
        confidence: 85,
        link: 'https://www.enisa.europa.eu'
      },
      {
        id: 'INTEL-010',
        timestamp: '8 hours ago',
        title: 'Reuters: Global Cyber Insurance Market Impact from Recent Attacks',
        description: 'Analysis of cyber insurance market changes following major ransomware incidents. Premium increases and coverage restrictions noted.',
        source: 'Reuters',
        sourceType: 'rss',
        severity: 'low',
        category: ['Insurance', 'Market Analysis', 'Ransomware'],
        indicators: [
          { type: 'Trend', value: 'Premium Increase' },
          { type: 'Impact', value: 'Coverage Restrictions' }
        ],
        confidence: 72,
        link: 'https://www.reuters.com'
      }
    ]

    const fetchIntelligence = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/intel')
        const data = await response.json()
        
        if (data.success) {
          setFindings(data.data)
        } else {
          console.error('Failed to fetch intelligence data:', data.error)
        }
      } catch (error) {
        console.error('Error fetching intelligence data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIntelligence()
  }, [])

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
    avgConfidence: Math.round(findings.reduce((acc, f) => acc + f.confidence, 0) / findings.length)
  }

  const topCategories = findings
    .flatMap(f => f.category)
    .reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const topCategoriesList = Object.entries(topCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

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

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Heatmap */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyber-blue" />
            <h3 className="font-semibold">Top Threat Categories</h3>
          </div>
          <div className="space-y-2">
            {topCategoriesList.map(([category, count]) => (
              <div key={category} className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple flex items-center px-3 text-sm font-medium"
                    style={{ width: `${(count / topCategoriesList[0][1]) * 100}%` }}
                  >
                    {category}
                  </div>
                </div>
                <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-cyber-blue" />
            <h3 className="font-semibold">Severity Distribution</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Critical</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-800 rounded-full h-4">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(stats.critical / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-red-400 w-12 text-right">{stats.critical}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">High</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-800 rounded-full h-4">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(stats.high / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-orange-400 w-12 text-right">{stats.high}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Medium</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-800 rounded-full h-4">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(findings.filter(f => f.severity === 'medium').length / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-yellow-400 w-12 text-right">
                  {findings.filter(f => f.severity === 'medium').length}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Low</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-800 rounded-full h-4">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(findings.filter(f => f.severity === 'low').length / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-blue-400 w-12 text-right">
                  {findings.filter(f => f.severity === 'low').length}
                </span>
              </div>
            </div>
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
        <div className="text-center py-12 text-gray-400">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No intelligence findings match your current filters</p>
        </div>
      )}
    </div>
  )
}

export default ConsolidatedIntelligence
