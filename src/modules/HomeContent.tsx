import React from 'react'
import { DagensPuls } from './DagensPuls'
import { StatCard } from '@components/ui/StatCard'
import { TrendingUp, AlertTriangle, Shield, Globe } from 'lucide-react'

interface Stat {
  label: string
  value: string
  trend: { value: string; direction: 'up' | 'down' }
  icon: typeof AlertTriangle
  color: 'red' | 'blue' | 'green' | 'purple'
}

/**
 * Home content - Dashboard overview
 * Displays key statistics, threat feed, and activity tracking
 */
export const HomeContent: React.FC = () => {
  const stats: Stat[] = [
    {
      label: 'Active Threats',
      value: '156',
      trend: { value: '+12%', direction: 'up' },
      icon: AlertTriangle,
      color: 'red'
    },
    {
      label: 'Monitored Sources',
      value: '89',
      trend: { value: '+5%', direction: 'up' },
      icon: Globe,
      color: 'blue'
    },
    {
      label: 'Protected Systems',
      value: '2.4K',
      trend: { value: '+8%', direction: 'up' },
      icon: Shield,
      color: 'green'
    },
    {
      label: 'Trend Score',
      value: '94',
      trend: { value: '+2%', direction: 'up' },
      icon: TrendingUp,
      color: 'purple'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid - Using Reusable StatCard Component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Dagens Puls - Main Threat Feed */}
      <DagensPuls />

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

export { HomeContent as default }
