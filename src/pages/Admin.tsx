import { useState, useEffect } from 'react'
import { Card } from '@components/Card'
import { Text } from '@components/Text'
import { Button } from '@components/Button'
import IntelControlPanel from '@components/IntelControlPanel'
import { 
  Settings, Database, Search, Globe, Key, Shield, 
  Play, Pause, RefreshCw, Trash2, Plus,
  Activity, CheckCircle, Bot, Brain, Zap, Eye, AlertCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react'

interface Keyword {
  id: string
  keyword: string
  category: string
  priority: 'high' | 'medium' | 'low'
  active: boolean
  lastHits: number
  created: string
}

interface Source {
  id: string
  name: string
  url: string
  type: 'rss' | 'forum' | 'marketplace' | 'social' | 'api'
  active: boolean
  lastScraped: string
  status: 'online' | 'offline' | 'error'
}

interface ScraperStatus {
  running: boolean
  lastRun: string
  totalDocuments: number
  recentFindings: number
  queueSize: number
}

interface VectorDBStats {
  totalVectors: number
  lastIndexed: string
  searchPerformance: string
  storageUsed: string
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'keywords' | 'sources' | 'scraper' | 'database' | 'settings' | 'intel-scraper' | 'control-panel'>('keywords')
  const [status, setStatus] = useState<string>('')
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus>({
    running: false,
    lastRun: '2 hours ago',
    totalDocuments: 15847,
    recentFindings: 34,
    queueSize: 0
  })
  const [vectorDBStats] = useState<VectorDBStats>({
    totalVectors: 45231,
    lastIndexed: '15 minutes ago',
    searchPerformance: '~120ms avg',
    storageUsed: '2.3 GB'
  })

  // New keyword form
  const [newKeyword, setNewKeyword] = useState({ keyword: '', category: '', priority: 'medium' as const })
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'rss' as const })

  // Intel Scraper specific state
  const [intelScraperStatus, setIntelScraperStatus] = useState({
    isRunning: false,
    totalSources: 18,
    activeSources: 15,
    activeJobs: 2,
    pendingApprovals: 3,
    complianceEnabled: true,
    emergencyBypass: false,
    lastActivity: '2024-01-15T14:23:00Z'
  })

  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 'approval_1',
      type: 'new_source',
      timestamp: '2024-01-15T13:15:00Z',
      data: {
        url: 'https://security-weekly.dk/threats',
        domain: 'security-weekly.dk',
        detectedPurpose: 'technical',
        initialRelevanceScore: 0.72,
        complianceRisk: 'low'
      },
      status: 'pending'
    },
    {
      id: 'approval_2',
      type: 'new_source',
      timestamp: '2024-01-15T12:45:00Z',
      data: {
        url: 'http://darkmarket.onion/intel',
        domain: 'darkmarket.onion',
        detectedPurpose: 'unknown',
        initialRelevanceScore: 0.45,
        complianceRisk: 'high'
      },
      status: 'pending'
    },
    {
      id: 'approval_3',
      type: 'historical_fetch',
      timestamp: '2024-01-15T11:30:00Z',
      data: {
        sourceName: 'CFCS Threat Reports',
        periodMonths: 12
      },
      status: 'pending'
    }
  ])

  const [newSourceCandidates, setNewSourceCandidates] = useState([
    {
      url: 'https://cybersecurity-news.eu/rss',
      domain: 'cybersecurity-news.eu',
      detectedPurpose: 'technical',
      foundVia: 'https://cfcs.dk/threat-analysis-2024',
      initialRelevanceScore: 0.83,
      complianceRisk: 'low',
      suggestedKeywords: ['cybersecurity', 'threats', 'vulnerabilities']
    },
    {
      url: 'https://politiken.dk/indland/it-politik/rss',
      domain: 'politiken.dk',
      detectedPurpose: 'political',
      foundVia: 'auto_discovery',
      initialRelevanceScore: 0.67,
      complianceRisk: 'low',
      suggestedKeywords: ['it-politik', 'digitalisering', 'lovgivning']
    },
    {
      url: 'http://underground-forum.onion/data',
      domain: 'underground-forum.onion',
      detectedPurpose: 'unknown',
      foundVia: 'link_analysis',
      initialRelevanceScore: 0.34,
      complianceRisk: 'high',
      suggestedKeywords: ['breach', 'credentials', 'exploits']
    }
  ])

  useEffect(() => {
    // Load mock data med dark-web kilder og politiske keywords
    setKeywords([
      { id: '1', keyword: 'ransomware', category: 'malware', priority: 'high', active: true, lastHits: 45, created: '2024-01-15' },
      { id: '2', keyword: 'APT28', category: 'actor', priority: 'high', active: true, lastHits: 12, created: '2024-01-16' },
      { id: '3', keyword: 'phishing', category: 'attack', priority: 'medium', active: true, lastHits: 89, created: '2024-01-17' },
      { id: '4', keyword: 'zero-day', category: 'vulnerability', priority: 'high', active: false, lastHits: 3, created: '2024-01-18' },
      { id: '5', keyword: 'credential dump', category: 'data', priority: 'medium', active: true, lastHits: 67, created: '2024-01-19' },
      // Politiske keywords
      { id: '6', keyword: 'lovforslag', category: 'politics', priority: 'medium', active: true, lastHits: 23, created: '2024-01-20' },
      { id: '7', keyword: 'cybersikkerhedslov', category: 'politics', priority: 'high', active: true, lastHits: 15, created: '2024-01-21' },
      { id: '8', keyword: 'EU Digital Services Act', category: 'politics', priority: 'medium', active: true, lastHits: 8, created: '2024-01-22' },
      { id: '9', keyword: 'kritisk infrastruktur', category: 'politics', priority: 'high', active: true, lastHits: 34, created: '2024-01-23' },
      { id: '10', keyword: 'GDPR', category: 'politics', priority: 'medium', active: true, lastHits: 19, created: '2024-01-24' }
    ])

    setSources([
      // Government & Legitimate Sources
      { id: '1', name: 'CFCS.dk RSS', url: 'https://cfcs.dk/da/nyheder/rss', type: 'rss', active: true, lastScraped: '5 min ago', status: 'online' },
      { id: '2', name: 'CERT-EU Advisories', url: 'https://cert.europa.eu/publications/rss', type: 'rss', active: true, lastScraped: '10 min ago', status: 'online' },
      { id: '3', name: 'Folketinget IT-politik', url: 'https://ft.dk/search/rss?q=cybersikkerhed', type: 'rss', active: true, lastScraped: '15 min ago', status: 'online' },
      { id: '4', name: 'ENISA Publications', url: 'https://enisa.europa.eu/news/rss', type: 'rss', active: true, lastScraped: '20 min ago', status: 'online' },
      { id: '5', name: 'Version2 Sikkerhed', url: 'https://version2.dk/sikkerhed/rss', type: 'rss', active: true, lastScraped: '25 min ago', status: 'online' },
      
      // Dark Web Sources (Top 10 fra prompt)
      { id: '6', name: 'BreachForums', url: 'http://breachforums.onion/data-trading', type: 'forum', active: true, lastScraped: '1 hour ago', status: 'online' },
      { id: '7', name: 'XSS Forum', url: 'http://xss.onion/exploits', type: 'forum', active: true, lastScraped: '2 hours ago', status: 'online' },
      { id: '8', name: 'LeakBase', url: 'http://leakbase.onion/vulnerabilities', type: 'forum', active: false, lastScraped: '1 day ago', status: 'offline' },
      { id: '9', name: 'Exploit.in', url: 'http://exploit.onion/raas', type: 'forum', active: true, lastScraped: '3 hours ago', status: 'online' },
      { id: '10', name: 'Altenen Forum', url: 'http://altenen.onion/fraud', type: 'forum', active: true, lastScraped: '4 hours ago', status: 'online' },
      { id: '11', name: 'Nulled Forum', url: 'http://nulled.onion/leaks', type: 'forum', active: true, lastScraped: '5 hours ago', status: 'error' },
      { id: '12', name: 'RAMP Marketplace', url: 'http://ramp.onion/access-market', type: 'marketplace', active: true, lastScraped: '6 hours ago', status: 'online' },
      { id: '13', name: 'Cracked Forum', url: 'http://cracked.onion/combos', type: 'forum', active: false, lastScraped: '2 days ago', status: 'offline' },
      { id: '14', name: 'CraxPro', url: 'http://craxpro.onion/credentials', type: 'forum', active: true, lastScraped: '7 hours ago', status: 'online' },
      { id: '15', name: 'Dread (DarkForums)', url: 'http://dread.onion/hacking', type: 'forum', active: true, lastScraped: '8 hours ago', status: 'online' },
      
      // Social & Media
      { id: '16', name: 'Reddit r/netsec', url: 'https://reddit.com/r/netsec.rss', type: 'social', active: true, lastScraped: '30 min ago', status: 'online' },
      { id: '17', name: 'CERT-DK Twitter', url: 'https://twitter.com/certdk', type: 'social', active: true, lastScraped: '45 min ago', status: 'online' },
      { id: '18', name: 'DR Nyheder Cybersikkerhed', url: 'https://dr.dk/nyheder/cybersikkerhed/rss', type: 'rss', active: true, lastScraped: '1 hour ago', status: 'online' }
    ])
  }, [])

  const addKeyword = () => {
    if (!newKeyword.keyword.trim()) return
    const keyword: Keyword = {
      id: Date.now().toString(),
      keyword: newKeyword.keyword,
      category: newKeyword.category || 'general',
      priority: newKeyword.priority,
      active: true,
      lastHits: 0,
      created: new Date().toISOString().split('T')[0]
    }
    setKeywords([...keywords, keyword])
    setNewKeyword({ keyword: '', category: '', priority: 'medium' })
  }

  const addSource = () => {
    if (!newSource.name.trim() || !newSource.url.trim()) return
    const source: Source = {
      id: Date.now().toString(),
      name: newSource.name,
      url: newSource.url,
      type: newSource.type,
      active: true,
      lastScraped: 'Never',
      status: 'offline'
    }
    setSources([...sources, source])
    setNewSource({ name: '', url: '', type: 'rss' })
  }

  const toggleKeyword = (id: string) => {
    setKeywords(keywords.map(k => k.id === id ? { ...k, active: !k.active } : k))
  }

  const toggleSource = (id: string) => {
    setSources(sources.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const deleteKeyword = (id: string) => {
    setKeywords(keywords.filter(k => k.id !== id))
  }

  const deleteSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id))
  }

    const runScraper = () => {
    setStatus('Starting scraper...')
    setScraperStatus(prev => ({ ...prev, running: true, queueSize: 50 }))
    try {
      // Simulate API call
      setTimeout(() => {
        setScraperStatus(prev => ({ 
          ...prev, 
          running: false, 
          lastRun: 'Just now', 
          totalDocuments: prev.totalDocuments + 23,
          recentFindings: 23,
          queueSize: 0
        }))
        setStatus('Scraper completed successfully')
      }, 5000)
    } catch (err: any) {
      setStatus('Error: ' + err.message)
      setScraperStatus(prev => ({ ...prev, running: false, queueSize: 0 }))
    }
  }

  // Intel Scraper specific functions
  const handleStartIntelScraper = async () => {
    try {
      setStatus('Starting Intel Scraper...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIntelScraperStatus(prev => ({ 
        ...prev, 
        isRunning: true, 
        lastActivity: new Date().toISOString() 
      }))
      setStatus('Intel Scraper started successfully')
    } catch (error) {
      setStatus('Failed to start Intel Scraper')
    }
  }

  const handleStopIntelScraper = async () => {
    try {
      setStatus('Stopping Intel Scraper...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIntelScraperStatus(prev => ({ ...prev, isRunning: false }))
      setStatus('Intel Scraper stopped')
    } catch (error) {
      setStatus('Failed to stop Intel Scraper')
    }
  }

  const handleEmergencyBypass = async () => {
    if (confirm('⚠️ ADVARSEL: Emergency Bypass deaktiverer alle compliance checks i 1 time. Fortsæt kun i kritiske situationer!')) {
      try {
        setStatus('Enabling Emergency Bypass...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIntelScraperStatus(prev => ({ 
          ...prev, 
          emergencyBypass: true, 
          complianceEnabled: false 
        }))
        setStatus('🚨 EMERGENCY BYPASS ENABLED - Auto-disable in 1 hour')
        
        // Auto-disable after 1 hour
        setTimeout(() => {
          setIntelScraperStatus(prev => ({ 
            ...prev, 
            emergencyBypass: false, 
            complianceEnabled: true 
          }))
          setStatus('Emergency Bypass auto-disabled')
        }, 3600000)
      } catch (error) {
        setStatus('Failed to enable Emergency Bypass')
      }
    }
  }

  const handleApproveSource = async (approvalId: string, decision: 'approve' | 'reject') => {
    try {
      setStatus(`${decision === 'approve' ? 'Approving' : 'Rejecting'} source...`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPendingApprovals(prev => prev.filter(a => a.id !== approvalId))
      setIntelScraperStatus(prev => ({ 
        ...prev, 
        pendingApprovals: prev.pendingApprovals - 1 
      }))
      
      setStatus(`Source ${decision === 'approve' ? 'approved' : 'rejected'} successfully`)
    } catch (error) {
      setStatus(`Failed to ${decision} source`)
    }
  }

  const handleAddSourceCandidate = async (candidate: any, approved: boolean = false) => {
    try {
      setStatus('Adding source candidate...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (approved) {
        // Add directly to sources
        const newSourceEntry = {
          id: String(sources.length + 1),
          name: candidate.domain,
          url: candidate.url,
          type: candidate.detectedPurpose === 'technical' ? 'rss' : 'forum' as 'rss' | 'forum' | 'marketplace' | 'social' | 'api',
          active: true,
          lastScraped: 'Never',
          status: 'online' as 'online' | 'offline' | 'error'
        }
        setSources(prev => [...prev, newSourceEntry])
        setIntelScraperStatus(prev => ({ 
          ...prev, 
          totalSources: prev.totalSources + 1,
          activeSources: prev.activeSources + 1
        }))
      } else {
        // Add to pending approvals
        const newApproval = {
          id: `approval_${Date.now()}`,
          type: 'new_source',
          timestamp: new Date().toISOString(),
          data: candidate,
          status: 'pending'
        }
        setPendingApprovals(prev => [...prev, newApproval])
        setIntelScraperStatus(prev => ({ 
          ...prev, 
          pendingApprovals: prev.pendingApprovals + 1 
        }))
      }
      
      setNewSourceCandidates(prev => prev.filter(c => c.url !== candidate.url))
      setStatus(`Source candidate ${approved ? 'added directly' : 'sent for approval'}`)
    } catch (error) {
      setStatus('Failed to process source candidate')
    }
  }

  const tabs = [
    { id: 'keywords' as const, label: 'Keywords', icon: Key },
    { id: 'sources' as const, label: 'Sources', icon: Globe },
    { id: 'scraper' as const, label: 'Scraper', icon: Activity },
    { id: 'intel-scraper' as const, label: 'Intel Scraper', icon: Bot },
    { id: 'control-panel' as const, label: 'Control Panel', icon: Brain },
    { id: 'database' as const, label: 'Vector DB', icon: Database },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10 rounded-lg p-6 border border-cyber-blue/30">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyber-blue" />
          <div>
            <h1 className="text-2xl font-bold">Administration Panel</h1>
            <p className="text-sm text-gray-400">Manage keywords, sources, scraper, and vector database</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-cyber-blue text-cyber-blue bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'keywords' && (
          <>
            {/* Add New Keyword */}
            <Card>
              <Text variant="title">Add New Keyword</Text>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="Keyword (e.g. ransomware)"
                  value={newKeyword.keyword}
                  onChange={(e) => setNewKeyword({...newKeyword, keyword: e.target.value})}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Category (malware, actor, politics, etc.)"
                  value={newKeyword.category}
                  onChange={(e) => setNewKeyword({...newKeyword, category: e.target.value})}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
                />
                <select
                  value={newKeyword.priority}
                  onChange={(e) => setNewKeyword({...newKeyword, priority: e.target.value as any})}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <Button onClick={addKeyword}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Keyword
                </Button>
              </div>
            </Card>

            {/* Keywords List */}
            <Card>
              <Text variant="title">Monitored Keywords ({keywords.length})</Text>
              <div className="space-y-2 mt-4">
                {keywords.map((keyword) => (
                  <div key={keyword.id} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${keyword.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <span className="font-medium">{keyword.keyword}</span>
                        <div className="text-xs text-gray-400">
                          {keyword.category} • {keyword.priority} priority • {keyword.lastHits} hits
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleKeyword(keyword.id)}
                        className={`px-3 py-1 rounded text-xs ${keyword.active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                      >
                        {keyword.active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => deleteKeyword(keyword.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {activeTab === 'sources' && (
          <>
            {/* Add New Source */}
            <Card>
              <Text variant="title">Add New Source</Text>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="Source name"
                  value={newSource.name}
                  onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={newSource.url}
                  onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
                />
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({...newSource, type: e.target.value as any})}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="rss">RSS Feed</option>
                  <option value="forum">Dark Web Forum</option>
                  <option value="marketplace">Dark Web Marketplace</option>
                  <option value="social">Social Media</option>
                  <option value="api">API Endpoint</option>
                  <option value="government">Government Source</option>
                </select>
                <Button onClick={addSource}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </Card>

            {/* Sources List */}
            <Card>
              <Text variant="title">Monitoring Sources ({sources.length})</Text>
              <div className="space-y-2 mt-4">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        source.status === 'online' ? 'bg-green-500' : 
                        source.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <span className="font-medium">{source.name}</span>
                        <div className="text-xs text-gray-400">
                          {source.type} • Last scraped: {source.lastScraped}
                        </div>
                        <div className="text-xs text-gray-500">{source.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSource(source.id)}
                        className={`px-3 py-1 rounded text-xs ${source.active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                      >
                        {source.active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => deleteSource(source.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {activeTab === 'scraper' && (
          <>
            {/* Scraper Status */}
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="title">Scraper Status</Text>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  scraperStatus.running ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${scraperStatus.running ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                  {scraperStatus.running ? 'Running' : 'Idle'}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Total Documents</div>
                  <div className="text-xl font-bold">{scraperStatus.totalDocuments.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Recent Findings</div>
                  <div className="text-xl font-bold text-cyber-blue">{scraperStatus.recentFindings}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Queue Size</div>
                  <div className="text-xl font-bold">{scraperStatus.queueSize}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Last Run</div>
                  <div className="text-sm font-medium">{scraperStatus.lastRun}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={runScraper} disabled={scraperStatus.running}>
                  {scraperStatus.running ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Scraper
                    </>
                  )}
                </Button>
                <Button variant="danger" disabled={!scraperStatus.running}>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Scraper
                </Button>
              </div>
              {status && <Text className="mt-2 text-sm text-gray-400">{status}</Text>}
            </Card>
          </>
        )}

        {activeTab === 'intel-scraper' && (
          <>
            {/* Intel Scraper Status */}
            <Card>
              <div className="flex items-center justify-between">
                <Text variant="title" className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyber-blue" />
                  Intel Scraper Status
                </Text>
                {intelScraperStatus.emergencyBypass && (
                  <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    🚨 EMERGENCY BYPASS ACTIVE
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Status
                  </div>
                  <div className={`text-lg font-bold ${intelScraperStatus.isRunning ? 'text-green-400' : 'text-gray-400'}`}>
                    {intelScraperStatus.isRunning ? 'RUNNING' : 'STOPPED'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Sources
                  </div>
                  <div className="text-lg font-bold">{intelScraperStatus.activeSources}/{intelScraperStatus.totalSources}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Active Jobs
                  </div>
                  <div className="text-lg font-bold text-cyber-blue">{intelScraperStatus.activeJobs}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending Approvals
                  </div>
                  <div className="text-lg font-bold text-yellow-400">{intelScraperStatus.pendingApprovals}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Compliance
                  </div>
                  <div className={`text-sm font-bold ${intelScraperStatus.complianceEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {intelScraperStatus.complianceEnabled ? 'ENABLED' : 'DISABLED'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Last Activity</div>
                  <div className="text-sm font-medium">
                    {new Date(intelScraperStatus.lastActivity).toLocaleString('da-DK')}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!intelScraperStatus.isRunning ? (
                  <Button onClick={handleStartIntelScraper} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Intel Scraper
                  </Button>
                ) : (
                  <Button onClick={handleStopIntelScraper} variant="danger">
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Intel Scraper
                  </Button>
                )}
                
                <Button 
                  onClick={handleEmergencyBypass} 
                  variant="danger" 
                  className="bg-red-700 hover:bg-red-800"
                  disabled={intelScraperStatus.emergencyBypass}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Emergency Bypass
                </Button>
              </div>
              
              {status && (
                <div className="mt-3 p-2 bg-gray-800 rounded text-sm">
                  <span className="text-gray-400">Status:</span> {status}
                </div>
              )}
            </Card>

            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <Card>
                <Text variant="title" className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Pending Approvals ({pendingApprovals.length})
                </Text>
                
                <div className="space-y-4 mt-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="bg-gray-800 p-4 rounded border border-yellow-400/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                              {approval.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(approval.timestamp).toLocaleString('da-DK')}
                            </span>
                          </div>
                          
                          {approval.type === 'new_source' && (
                            <div className="space-y-2">
                              <div><span className="text-gray-400">URL:</span> {approval.data.url}</div>
                              <div><span className="text-gray-400">Domain:</span> {approval.data.domain}</div>
                              <div><span className="text-gray-400">Purpose:</span> {approval.data.detectedPurpose}</div>
                              <div><span className="text-gray-400">Relevance:</span> {Math.round((approval.data.initialRelevanceScore || 0) * 100)}%</div>
                              <div>
                                <span className="text-gray-400">Risk:</span> 
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                  approval.data.complianceRisk === 'high' ? 'bg-red-600' :
                                  approval.data.complianceRisk === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                                } text-white`}>
                                  {(approval.data.complianceRisk || 'unknown').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {approval.type === 'historical_fetch' && (
                            <div className="space-y-2">
                              <div><span className="text-gray-400">Source:</span> {approval.data.sourceName}</div>
                              <div><span className="text-gray-400">Period:</span> {approval.data.periodMonths} months</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button 
                            onClick={() => handleApproveSource(approval.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleApproveSource(approval.id, 'reject')}
                            variant="danger"
                            className="px-3 py-1 text-sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* New Source Candidates */}
            {newSourceCandidates.length > 0 && (
              <Card>
                <Text variant="title" className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyber-purple" />
                  Auto-Discovered Sources ({newSourceCandidates.length})
                </Text>
                
                <div className="space-y-4 mt-4">
                  {newSourceCandidates.map((candidate, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded border border-cyber-purple/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-cyber-purple text-white px-2 py-1 rounded text-xs font-bold">
                              {candidate.detectedPurpose.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">
                              Found via: {candidate.foundVia}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div><span className="text-gray-400">URL:</span> {candidate.url}</div>
                            <div><span className="text-gray-400">Domain:</span> {candidate.domain}</div>
                            <div><span className="text-gray-400">Relevance:</span> {Math.round(candidate.initialRelevanceScore * 100)}%</div>
                            <div>
                              <span className="text-gray-400">Risk:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                candidate.complianceRisk === 'high' ? 'bg-red-600' :
                                candidate.complianceRisk === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                              } text-white`}>
                                {candidate.complianceRisk.toUpperCase()}
                              </span>
                            </div>
                            {candidate.suggestedKeywords && (
                              <div>
                                <span className="text-gray-400">Suggested Keywords:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {candidate.suggestedKeywords.map((kw, kwIndex) => (
                                    <span key={kwIndex} className="bg-gray-700 px-2 py-1 rounded text-xs">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {candidate.complianceRisk === 'low' && (
                            <Button 
                              onClick={() => handleAddSourceCandidate(candidate, true)}
                              className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Add Direct
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleAddSourceCandidate(candidate, false)}
                            className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 text-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Request Approval
                          </Button>
                          <Button 
                            onClick={() => setNewSourceCandidates(prev => prev.filter(c => c.url !== candidate.url))}
                            variant="danger"
                            className="px-3 py-1 text-sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {activeTab === 'control-panel' && (
          <IntelControlPanel />
        )}

        {activeTab === 'database' && (
          <>
            {/* Vector Database Stats */}
            <Card>
              <Text variant="title">Vector Database Statistics</Text>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Total Vectors</div>
                  <div className="text-xl font-bold">{vectorDBStats.totalVectors.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Storage Used</div>
                  <div className="text-xl font-bold">{vectorDBStats.storageUsed}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Search Performance</div>
                  <div className="text-xl font-bold text-green-400">{vectorDBStats.searchPerformance}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs text-gray-400">Last Indexed</div>
                  <div className="text-sm font-medium">{vectorDBStats.lastIndexed}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rebuild Index
                </Button>
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Test Search
                </Button>
                <Button variant="danger">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Database
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            {/* System Settings */}
            <Card>
              <Text variant="title">System Settings</Text>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Scraper Interval (minutes)</label>
                    <input
                      type="number"
                      defaultValue={30}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Documents per Run</label>
                    <input
                      type="number"
                      defaultValue={1000}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Vector Embedding Model</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                      <option>text-embedding-ada-002</option>
                      <option>text-embedding-3-small</option>
                      <option>text-embedding-3-large</option>
                    </select>
                  </div>
                </div>
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}