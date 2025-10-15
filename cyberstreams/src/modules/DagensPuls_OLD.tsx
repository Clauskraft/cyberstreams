import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, Clock, ExternalLink } from 'lucide-react'

interface PulseItem {
  id: string
  title: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  source: string
  timestamp: string
  description: string
  url?: string
}

const DagensPuls = () => {
  const [pulseData, setPulseData] = useState<PulseItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const mockData: PulseItem[] = [
      {
        id: '1',
        title: 'New Ransomware Strain Targeting Healthcare',
        category: 'Ransomware',
        severity: 'critical',
        source: 'Dark Web Forum Alpha',
        timestamp: '2 hours ago',
        description: 'A new ransomware variant specifically targeting hospital systems has been detected across multiple dark web markets.',
        url: '#',
      },
      {
        id: '2',
        title: 'Major Data Breach: 500K User Records Leaked',
        category: 'Data Leak',
        severity: 'high',
        source: 'Breach Database',
        timestamp: '4 hours ago',
        description: 'Credentials from a major e-commerce platform have surfaced on underground markets.',
        url: '#',
      },
      {
        id: '3',
        title: 'Zero-Day Exploit Being Sold',
        category: 'Exploit',
        severity: 'critical',
        source: 'Exploit Market',
        timestamp: '6 hours ago',
        description: 'A previously unknown vulnerability in common enterprise software is being auctioned.',
        url: '#',
      },
      {
        id: '4',
        title: 'Phishing Campaign Targeting Financial Sector',
        category: 'Phishing',
        severity: 'high',
        source: 'Threat Intelligence Feed',
        timestamp: '8 hours ago',
        description: 'Sophisticated phishing emails mimicking bank communications detected.',
        url: '#',
      },
      {
        id: '5',
        title: 'Botnet Infrastructure Update',
        category: 'Malware',
        severity: 'medium',
        source: 'C2 Tracker',
        timestamp: '12 hours ago',
        description: 'Major botnet has shifted to new command and control servers.',
        url: '#',
      },
      {
        id: '6',
        title: 'Cryptocurrency Scam Network Exposed',
        category: 'Fraud',
        severity: 'medium',
        source: 'Fraud Monitor',
        timestamp: '1 day ago',
        description: 'Large-scale cryptocurrency scam operation identified across multiple platforms.',
        url: '#',
      },
      {
        id: '7',
        title: 'DDoS-for-Hire Service Advertising',
        category: 'DDoS',
        severity: 'high',
        source: 'Underground Service',
        timestamp: '1 day ago',
        description: 'New DDoS service offering high-capacity attacks at competitive prices.',
        url: '#',
      },
      {
        id: '8',
        title: 'Stolen Corporate VPN Credentials',
        category: 'Access',
        severity: 'high',
        source: 'Access Broker',
        timestamp: '2 days ago',
        description: 'VPN access to Fortune 500 companies being sold on criminal forums.',
        url: '#',
      },
      {
        id: '9',
        title: 'Malware Campaign Targeting Mobile Devices',
        category: 'Malware',
        severity: 'medium',
        source: 'Mobile Threat Intel',
        timestamp: '2 days ago',
        description: 'Banking trojan spreading through fake productivity apps.',
        url: '#',
      },
      {
        id: '10',
        title: 'Vulnerability Discussion in Hacker Forums',
        category: 'Intelligence',
        severity: 'low',
        source: 'Forum Monitor',
        timestamp: '3 days ago',
        description: 'Active discussions about potential vulnerabilities in IoT devices.',
        url: '#',
      },
    ]

    setTimeout(() => {
      setPulseData(mockData)
      setLoading(false)
    }, 1000)

    // Simulate real-time updates
    const interval = setInterval(() => {
      setPulseData((prev) => {
        const updated = [...prev]
        // Rotate first item to end to simulate new data
        const first = updated.shift()
        if (first) {
          updated.push({ ...first, timestamp: 'Just now' })
        }
        return updated
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyber-blue/10 border border-cyber-blue/20">
            <TrendingUp className="w-6 h-6 text-cyber-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Dagens Puls</h2>
            <p className="text-sm text-gray-400">Real-time threat intelligence feed</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">UPDATING</span>
        </div>
      </div>

      {/* Pulse Items */}
      <div className="space-y-4">
        {pulseData.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${getSeverityColor(
                      item.severity
                    )}`}
                  >
                    {item.severity.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-cyber-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{item.source}</span>
                  </span>
                </div>
              </div>
              {item.url && (
                <button className="ml-4 p-2 rounded-lg hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DagensPuls
