import SignalStream from './SignalStream'
import { TrendingUp, AlertTriangle, Shield, Globe } from 'lucide-react'
import { useState, useEffect } from 'react'

const HomeContent = () => {
  const [stats, setStats] = useState([
    { label: 'Active Threats', value: '0', change: '+0%', icon: AlertTriangle, color: 'red' },
    { label: 'Monitored Sources', value: '0', change: '+0%', icon: Globe, color: 'blue' },
    { label: 'Protected Systems', value: '0', change: '+0%', icon: Shield, color: 'green' },
    { label: 'Trend Score', value: '0', change: '+0%', icon: TrendingUp, color: 'purple' },
  ])

  // Fetch real data from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pulseResponse, statsResponse] = await Promise.all([
          fetch('/api/pulse'),
          fetch('/api/stats')
        ])
        
        const pulseData = await pulseResponse.json()
        const statsData = await statsResponse.json()
        
        if (pulseData.success && statsData.success) {
          const threats = pulseData.data?.length || 0
          const sources = statsData.data?.sources || 0
          const results = statsData.data?.results || 0
          const keywords = statsData.data?.keywords || 0
          
          setStats([
            { label: 'Active Threats', value: threats.toString(), change: '+12%', icon: AlertTriangle, color: 'red' },
            { label: 'Monitored Sources', value: sources.toString(), change: '+5%', icon: Globe, color: 'blue' },
            { label: 'Protected Systems', value: `${results}`, change: '+8%', icon: Shield, color: 'green' },
            { label: 'Trend Score', value: keywords.toString(), change: '+2%', icon: TrendingUp, color: 'purple' },
          ])
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

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
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${stat.color}-500/20 text-${stat.color}-300 border border-${stat.color}-500/30`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold mb-1 text-white">{stat.value}</p>
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
            {[
              { name: 'Ransomware', count: 45, percentage: 75 },
              { name: 'Data Leaks', count: 32, percentage: 60 },
              { name: 'Malware', count: 28, percentage: 45 },
              { name: 'Phishing', count: 21, percentage: 35 },
            ].map((category, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{category.name}</span>
                  <span className="text-sm font-medium">{category.count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-cyber-blue h-2 rounded-full transition-all"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { time: '2 min ago', action: 'New threat detected', severity: 'high' },
              { time: '15 min ago', action: 'Source scan completed', severity: 'low' },
              { time: '1 hour ago', action: 'Data indexed', severity: 'medium' },
              { time: '2 hours ago', action: 'Alert triggered', severity: 'high' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    activity.severity === 'high'
                      ? 'bg-red-500'
                      : activity.severity === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeContent
