import SignalStream from './SignalStream'
import { TrendingUp, AlertTriangle, Shield, Globe } from 'lucide-react'

const HomeContent = () => {
  const stats = [
    { label: 'Active Threats', value: '156', change: '+12%', icon: AlertTriangle, color: 'red' },
    { label: 'Monitored Sources', value: '89', change: '+5%', icon: Globe, color: 'blue' },
    { label: 'Protected Systems', value: '2.4K', change: '+8%', icon: Shield, color: 'green' },
    { label: 'Trend Score', value: '94', change: '+2%', icon: TrendingUp, color: 'purple' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.color}-500/20 text-${stat.color}-300 border border-${stat.color}-500/30`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold mb-1 text-white">{stat.value}</p>
            <p className="text-sm text-white/80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* SignalStream - Differentiated intelligence lane */}
      {/* <SignalStream /> */}

      {/* Additional Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4 text-white">Threat Categories</h3>
          <div className="space-y-3">
            {[
              { name: 'Ransomware', count: 45, percentage: 75 },
              { name: 'Data Leaks', count: 32, percentage: 60 },
              { name: 'Malware', count: 28, percentage: 45 },
              { name: 'Phishing', count: 21, percentage: 35 },
            ].map((category, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/80">{category.name}</span>
                  <span className="text-sm font-medium text-white">{category.count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { time: '2 min ago', action: 'New threat detected', severity: 'high' },
              { time: '15 min ago', action: 'Source scan completed', severity: 'low' },
              { time: '1 hour ago', action: 'Data indexed', severity: 'medium' },
              { time: '2 hours ago', action: 'Alert triggered', severity: 'high' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{activity.action}</p>
                  <p className="text-xs text-white/60">{activity.time}</p>
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