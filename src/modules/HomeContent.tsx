import SignalStream from './SignalStream'
import { TrendingUp, AlertTriangle, Shield, Globe } from 'lucide-react'
import { useState, useEffect } from 'react'

const HomeContent = () => {
  const [stats, setStats] = useState([
    { label: 'Active Threats', value: '0', change: '--', icon: AlertTriangle, color: 'red' },
    { label: 'Monitored Sources', value: '0', change: '--', icon: Globe, color: 'blue' },
    { label: 'Protected Systems', value: '0', change: '--', icon: Shield, color: 'green' },
    { label: 'Trend Score', value: '--', change: '--', icon: TrendingUp, color: 'purple' },
  ])

  useEffect(() => {
    // Load real stats from API - NO HARDCODED DEMO DATA
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const result = await response.json()
        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        // Keep zeros - no demo data
      }
    }
    fetchStats()
  }, [])
  
  // Removed hardcoded demo stats:
  // { label: 'Active Threats', value: '156', change: '+12%', icon: AlertTriangle, color: 'red' },
  // { label: 'Monitored Sources', value: '89', change: '+5%', icon: Globe, color: 'blue' },
  // { label: 'Protected Systems', value: '2.4K', change: '+8%', icon: Shield, color: 'green' },
  // { label: 'Trend Score', value: '94', change: '+2%', icon: TrendingUp, color: 'purple' },

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.color}-500/10 text-${stat.color}-400`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* SignalStream - Differentiated intelligence lane */}
      <SignalStream />

      {/* Additional Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Threat Categories</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Loading real threat data...</p>
            {/* Removed hardcoded demo data:
            { name: 'Ransomware', count: 45, percentage: 75 },
            { name: 'Data Leaks', count: 32, percentage: 60 },
            { name: 'Malware', count: 28, percentage: 45 },
            { name: 'Phishing', count: 21, percentage: 35 },
            */}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Loading real activity data...</p>
            {/* Removed hardcoded demo data:
            { time: '2 min ago', action: 'New threat detected', severity: 'high' },
            { time: '15 min ago', action: 'Source scan completed', severity: 'low' },
            { time: '1 hour ago', action: 'Data indexed', severity: 'medium' },
            { time: '2 hours ago', action: 'Alert triggered', severity: 'high' },
            */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeContent
