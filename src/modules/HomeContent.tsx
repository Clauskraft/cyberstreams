import SignalStream from './SignalStream'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, AlertTriangle, Shield, Globe, Network, Server, Radio } from 'lucide-react'

type StatColor = 'red' | 'blue' | 'green' | 'purple'

type CapabilityStatus = 'online' | 'degraded' | 'offline'

const statColorClasses: Record<StatColor, { icon: string; badge: string }> = {
  red: { icon: 'text-red-500', badge: 'bg-red-500/10 text-red-400' },
  blue: { icon: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-400' },
  green: { icon: 'text-green-500', badge: 'bg-green-500/10 text-green-400' },
  purple: { icon: 'text-purple-500', badge: 'bg-purple-500/10 text-purple-400' },
}

const HomeContent = () => {
  const stats: Array<{
    label: string
    value: string
    change: string
    icon: LucideIcon
    color: StatColor
  }> = [
    { label: 'Active Threats', value: '156', change: '+12%', icon: AlertTriangle, color: 'red' },
    { label: 'Monitored Sources', value: '89', change: '+5%', icon: Globe, color: 'blue' },
    { label: 'Protected Systems', value: '2.4K', change: '+8%', icon: Shield, color: 'green' },
    { label: 'Trend Score', value: '94', change: '+2%', icon: TrendingUp, color: 'purple' },
  ]

  const capabilityStatusClasses: Record<CapabilityStatus, string> = {
    online: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    degraded: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    offline: 'bg-red-500/10 text-red-400 border border-red-500/30',
  }

  const capabilityStatusLabel: Record<CapabilityStatus, string> = {
    online: 'Online',
    degraded: 'Degraded',
    offline: 'Offline',
  }

  const capabilities: Array<{
    id: string
    title: string
    description: string
    status: CapabilityStatus
    icon: LucideIcon
    detail: string
  }> = [
    {
      id: 'cti-module',
      title: 'CTI Module',
      description: 'Consolidated Intelligence workspace synched with NATO, CERT.DK og Europol feeds.',
      status: 'online',
      icon: Network,
      detail: '45 korrelerede efterretninger',
    },
    {
      id: 'infrastructure',
      title: 'Infrastruktur Setup',
      description: 'Railway deployment & ingestion workers matcher production-konfigurationen.',
      status: 'online',
      icon: Server,
      detail: 'Railway · Vercel · Supabase',
    },
    {
      id: 'osint',
      title: 'OSINT Dækning',
      description: 'SignalStream overvåger ENISA, CFCS, FE-DDIS og 12 verificerede kilder.',
      status: 'online',
      icon: Radio,
      detail: '12 aktive kilder',
    },
  ]

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
              <stat.icon className={`w-8 h-8 ${statColorClasses[stat.color].icon}`} />
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statColorClasses[stat.color].badge}`}>
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

      {/* Capability Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {capabilities.map((capability) => (
          <div
            key={capability.id}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/20">
                  <capability.icon className="w-5 h-5 text-cyber-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{capability.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mt-1">{capability.detail}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${capabilityStatusClasses[capability.status]}`}>
                {capabilityStatusLabel[capability.status]}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-4 leading-relaxed">{capability.description}</p>
          </div>
        ))}
      </div>

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
