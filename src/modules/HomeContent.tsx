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
      <div className="tdc-grid tdc-grid-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="tdc-card tdc-fade-in"
          >
            <div className="tdc-flex-between tdc-mb-md">
              <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
              <span className={`tdc-status-${stat.color === 'red' ? 'error' : stat.color === 'green' ? 'success' : 'warning'}`}>
                {stat.change}
              </span>
            </div>
            <p className="tdc-heading-2 text-white">{stat.value}</p>
            <p className="tdc-body-small text-white/80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* SignalStream - Differentiated intelligence lane */}
      {/* <SignalStream /> */}

      {/* Additional Dashboard Widgets */}
      <div className="tdc-grid tdc-grid-2">
        <div className="tdc-card tdc-fade-in">
          <div className="tdc-card-header">
            <h3 className="tdc-heading-3">Threat Categories</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Ransomware', count: 45, percentage: 75 },
              { name: 'Data Leaks', count: 32, percentage: 60 },
              { name: 'Malware', count: 28, percentage: 45 },
              { name: 'Phishing', count: 21, percentage: 35 },
            ].map((category, idx) => (
              <div key={idx}>
                <div className="tdc-flex-between tdc-mb-sm">
                  <span className="tdc-body-small text-white/80">{category.name}</span>
                  <span className="tdc-body-small font-medium text-white">{category.count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-tdc-primary-digital-blue h-2 rounded-full transition-all"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tdc-card tdc-fade-in">
          <div className="tdc-card-header">
            <h3 className="tdc-heading-3">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {[
              { time: '2 min ago', action: 'New threat detected', severity: 'high' },
              { time: '15 min ago', action: 'Source scan completed', severity: 'low' },
              { time: '1 hour ago', action: 'Data indexed', severity: 'medium' },
              { time: '2 hours ago', action: 'Alert triggered', severity: 'high' },
            ].map((activity, idx) => (
              <div key={idx} className="tdc-flex-between py-2 border-b border-gray-700 last:border-0">
                <div>
                  <p className="tdc-body-small font-medium text-white">{activity.action}</p>
                  <p className="tdc-body-small text-white/60">{activity.time}</p>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    activity.severity === 'high'
                      ? 'bg-tdc-accent-red'
                      : activity.severity === 'medium'
                      ? 'bg-tdc-accent-yellow'
                      : 'bg-tdc-accent-green'
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