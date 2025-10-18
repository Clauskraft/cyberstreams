import React, { useState, useEffect } from 'react'
import { 
  Bot, Brain, Zap, Eye, Activity, Clock, 
  Shield, Globe, Database, Target, AlertTriangle,
  Play, Pause, RefreshCw, Settings, CheckCircle, XCircle
} from 'lucide-react'

interface IntelControlPanelProps {
  className?: string
}

interface ScraperMetrics {
  uptime: string
  totalScanned: number
  successRate: number
  avgResponseTime: number
  memoryUsage: string
  cpuUsage: number
}

interface RecentActivity {
  id: string
  timestamp: string
  action: string
  status: 'success' | 'warning' | 'error'
  details: string
}

const IntelControlPanel: React.FC<IntelControlPanelProps> = ({ className = '' }) => {
  const [scraperStatus, setScraperStatus] = useState({
    isRunning: false,
    lastActivity: '',
    activeSources: 15,
    totalSources: 18,
    activeJobs: 2,
    pendingApprovals: 3,
    complianceEnabled: true,
    emergencyBypass: false
  })

  const [metrics, setMetrics] = useState<ScraperMetrics>({
    uptime: '2d 14h 23m',
    totalScanned: 15847,
    successRate: 94.2,
    avgResponseTime: 1.8,
    memoryUsage: '2.1 GB',
    cpuUsage: 23
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      timestamp: '2 min ago',
      action: 'Source scan completed',
      status: 'success',
      details: 'CFCS.dk - 12 new documents found'
    },
    {
      id: '2',
      timestamp: '5 min ago',
      action: 'Keyword match detected',
      status: 'warning',
      details: 'High-priority keyword "zero-day" found in 3 sources'
    },
    {
      id: '3',
      timestamp: '8 min ago',
      action: 'New source discovered',
      status: 'success',
      details: 'Auto-discovered: cybersecurity-weekly.com'
    },
    {
      id: '4',
      timestamp: '12 min ago',
      action: 'Compliance check failed',
      status: 'error',
      details: 'Dark web source blocked by compliance filter'
    }
  ])

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setScraperStatus(prev => ({
        ...prev,
        lastActivity: new Date().toISOString()
      }))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleToggleScraper = async () => {
    setIsLoading(true)
    try {
      const endpoint = scraperStatus.isRunning ? '/api/intel-scraper/stop' : '/api/intel-scraper/start'
      const response = await fetch(endpoint, { method: 'POST' })
      
      if (response.ok) {
        setScraperStatus(prev => ({
          ...prev,
          isRunning: !prev.isRunning,
          lastActivity: new Date().toISOString()
        }))
      }
    } catch (error) {
      console.error('Failed to toggle scraper:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyBypass = async () => {
    if (confirm('⚠️ ADVARSEL: Emergency bypass vil deaktivere alle compliance checks i 1 time. Fortsæt?')) {
      setIsLoading(true)
      try {
        const response = await fetch('/api/intel-scraper/emergency-bypass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Manual activation from control panel' })
        })
        
        if (response.ok) {
          setScraperStatus(prev => ({
            ...prev,
            emergencyBypass: true,
            complianceEnabled: false
          }))
          
          // Auto-disable after 1 hour
          setTimeout(() => {
            setScraperStatus(prev => ({
              ...prev,
              emergencyBypass: false,
              complianceEnabled: true
            }))
          }, 3600000)
        }
      } catch (error) {
        console.error('Failed to enable emergency bypass:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleForceRefresh = async () => {
    setIsLoading(true)
    try {
      // Simulate force refresh
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setMetrics(prev => ({
        ...prev,
        totalScanned: prev.totalScanned + Math.floor(Math.random() * 50) + 10,
        avgResponseTime: Math.round((Math.random() * 2 + 1) * 10) / 10
      }))
      
      // Add new activity
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        timestamp: 'Just now',
        action: 'Manual refresh triggered',
        status: 'success',
        details: 'Full system refresh completed'
      }
      
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)])
    } catch (error) {
      console.error('Failed to refresh:', error)
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
              <span className="text-gray-400">Uptime:</span>
              <span className="font-bold text-green-400">{metrics.uptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Scanned:</span>
              <span className="font-bold text-cyan-400">{metrics.totalScanned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Success Rate:</span>
              <span className="font-bold text-green-400">{metrics.successRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Response:</span>
              <span className="font-bold text-blue-400">{metrics.avgResponseTime}s</span>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold">Resources</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Memory Usage:</span>
              <span className="font-bold text-blue-400">{metrics.memoryUsage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">CPU Usage:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-500"
                    style={{ width: `${metrics.cpuUsage}%` }}
                  />
                </div>
                <span className="font-bold text-yellow-400">{metrics.cpuUsage}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pending Approvals:</span>
              <span className="font-bold text-yellow-400">{scraperStatus.pendingApprovals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Control Actions
        </h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleToggleScraper}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              scraperStatus.isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : scraperStatus.isRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {scraperStatus.isRunning ? 'Stop Scraper' : 'Start Scraper'}
          </button>

          <button
            onClick={handleForceRefresh}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Force Refresh
          </button>

          <button
            onClick={handleEmergencyBypass}
            disabled={isLoading || scraperStatus.emergencyBypass}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-700 hover:bg-red-800 text-white transition-all ${
              isLoading || scraperStatus.emergencyBypass ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Bypass
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-400' :
                activity.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{activity.action}</p>
                  <span className="text-xs text-gray-400">{activity.timestamp}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{activity.details}</p>
              </div>
              
              <div className="flex-shrink-0">
                {activity.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                {activity.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                {activity.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default IntelControlPanel