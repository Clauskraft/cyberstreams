import { useState, useEffect } from 'react'
import {
  Shield, Search, Filter, AlertTriangle,
  TrendingUp, Database, Globe, Lock
} from 'lucide-react'

interface Threat {
  id: string
  name: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'active' | 'mitigated' | 'investigating'
  affectedSystems: number
  detectedAt: string
  lastUpdate: string
  description: string
  indicators: string[]
}

const ThreatsModule = () => {
  const [threats, setThreats] = useState<Threat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    // Mock threat data
    const mockThreats: Threat[] = [
      {
        id: 'THR-001',
        name: 'Ransomware-as-a-Service Distribution',
        type: 'Ransomware',
        severity: 'critical',
        status: 'active',
        affectedSystems: 47,
        detectedAt: '2 hours ago',
        lastUpdate: '15 min ago',
        description: 'Large-scale ransomware campaign targeting healthcare and financial sectors through compromised VPN credentials.',
        indicators: ['185.220.101.45', 'malicious-payload.exe', 'C2: darknet-server.onion']
      },
      {
        id: 'THR-002',
        name: 'Zero-Day Exploit CVE-2025-XXXX',
        type: 'Exploit',
        severity: 'critical',
        status: 'investigating',
        affectedSystems: 156,
        detectedAt: '5 hours ago',
        lastUpdate: '1 hour ago',
        description: 'Previously unknown vulnerability in enterprise software being actively exploited in the wild.',
        indicators: ['CVE-2025-XXXX', 'exploit-kit-v2.3', '192.168.1.100']
      },
      {
        id: 'THR-003',
        name: 'Data Exfiltration Campaign',
        type: 'Data Breach',
        severity: 'high',
        status: 'active',
        affectedSystems: 23,
        detectedAt: '1 day ago',
        lastUpdate: '3 hours ago',
        description: 'Systematic data theft operation targeting customer databases across multiple organizations.',
        indicators: ['data-stealer.py', '10.0.0.50', 'exfil-server.com']
      },
      {
        id: 'THR-004',
        name: 'Phishing Infrastructure Network',
        type: 'Phishing',
        severity: 'high',
        status: 'active',
        affectedSystems: 89,
        detectedAt: '1 day ago',
        lastUpdate: '6 hours ago',
        description: 'Coordinated phishing campaign using cloned banking websites to harvest credentials.',
        indicators: ['phishing-domain.net', 'credential-harvester.js']
      },
      {
        id: 'THR-005',
        name: 'Botnet C2 Infrastructure',
        type: 'Malware',
        severity: 'high',
        status: 'mitigated',
        affectedSystems: 234,
        detectedAt: '2 days ago',
        lastUpdate: '1 day ago',
        description: 'Command and control infrastructure for IoT botnet used in DDoS attacks.',
        indicators: ['bot-c2.darkweb', '203.0.113.42', 'mirai-variant-v3']
      },
      {
        id: 'THR-006',
        name: 'Supply Chain Compromise',
        type: 'APT',
        severity: 'critical',
        status: 'investigating',
        affectedSystems: 12,
        detectedAt: '3 days ago',
        lastUpdate: '8 hours ago',
        description: 'Advanced persistent threat targeting software supply chain to distribute backdoored updates.',
        indicators: ['update-server-compromised', 'backdoor.dll']
      },
      {
        id: 'THR-007',
        name: 'Cryptocurrency Mining Malware',
        type: 'Malware',
        severity: 'medium',
        status: 'mitigated',
        affectedSystems: 67,
        detectedAt: '3 days ago',
        lastUpdate: '1 day ago',
        description: 'Cryptojacking campaign leveraging browser-based mining scripts.',
        indicators: ['coinhive-alternative.js', 'mining-pool.io']
      },
      {
        id: 'THR-008',
        name: 'Credential Stuffing Attack',
        type: 'Access',
        severity: 'medium',
        status: 'active',
        affectedSystems: 145,
        detectedAt: '4 days ago',
        lastUpdate: '12 hours ago',
        description: 'Automated credential stuffing using previously breached password databases.',
        indicators: ['bruteforce-tool-v4', 'leaked-creds.txt']
      },
      {
        id: 'THR-009',
        name: 'SQL Injection Campaign',
        type: 'Web Attack',
        severity: 'medium',
        status: 'investigating',
        affectedSystems: 34,
        detectedAt: '5 days ago',
        lastUpdate: '1 day ago',
        description: 'Automated SQL injection attempts targeting vulnerable web applications.',
        indicators: ['sqlmap-automated', 'injection-payload-db']
      },
      {
        id: 'THR-010',
        name: 'Social Engineering Operation',
        type: 'Social Engineering',
        severity: 'low',
        status: 'investigating',
        affectedSystems: 8,
        detectedAt: '1 week ago',
        lastUpdate: '2 days ago',
        description: 'Targeted social engineering campaign aimed at executive-level personnel.',
        indicators: ['pretexting-calls', 'ceo-fraud-emails']
      }
    ]

    const fetchThreats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/threats')
        const data = await response.json()
        
        if (data.success) {
          // Convert API data to Threat format
          const threats: Threat[] = data.data.latestFindings?.map((finding: any) => ({
            id: finding.id,
            name: finding.title,
            type: finding.category[0] || 'Threat',
            severity: finding.severity,
            status: 'active',
            affectedSystems: Math.floor(Math.random() * 100) + 1,
            detectedAt: finding.timestamp,
            lastUpdate: finding.timestamp,
            description: finding.description,
            indicators: finding.iocs || []
          })) || []
          
          setThreats(threats)
        } else {
          console.error('Failed to fetch threats data:', data.error)
        }
      } catch (error) {
        console.error('Error fetching threats data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchThreats()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500/10 text-red-400'
      case 'investigating': return 'bg-yellow-500/10 text-yellow-400'
      case 'mitigated': return 'bg-green-500/10 text-green-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = threat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         threat.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || threat.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || threat.status === filterStatus

    return matchesSearch && matchesSeverity && matchesStatus
  })

  const stats = {
    total: threats.length,
    critical: threats.filter(t => t.severity === 'critical').length,
    active: threats.filter(t => t.status === 'active').length,
    mitigated: threats.filter(t => t.status === 'mitigated').length
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Threats</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
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
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold text-orange-400">{stats.active}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Mitigated</p>
              <p className="text-2xl font-bold text-green-400">{stats.mitigated}</p>
            </div>
            <Lock className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search threats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyber-blue"
            />
          </div>
          <div className="flex gap-2">
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyber-blue"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="mitigated">Mitigated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Threats List */}
      <div className="space-y-4">
        {filteredThreats.map((threat) => (
          <div
            key={threat.id}
            className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-gray-500">{threat.id}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(threat.severity)}`}>
                    {threat.severity.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(threat.status)}`}>
                    {threat.status.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
                    {threat.type}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{threat.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{threat.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Affected:</span>
                    <span className="font-medium">{threat.affectedSystems} systems</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Detected:</span>
                    <span className="font-medium">{threat.detectedAt}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Updated:</span>
                    <span className="font-medium">{threat.lastUpdate}</span>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Indicators of Compromise (IOCs):</p>
                  <div className="flex flex-wrap gap-2">
                    {threat.indicators.map((ioc, idx) => (
                      <code
                        key={idx}
                        className="text-xs px-2 py-1 bg-gray-800 text-cyber-blue rounded border border-gray-700 font-mono"
                      >
                        {ioc}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredThreats.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No threats match your current filters</p>
        </div>
      )}
    </div>
  )
}

export default ThreatsModule
