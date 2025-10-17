import React from 'react'
import { LucideIcon } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'red' | 'green' | 'orange' | 'purple'
  trend?: {
    value: string
    direction: 'up' | 'down'
  }
  onClick?: () => void
}

const colorClasses = {
  blue: 'text-cyber-blue',
  red: 'text-red-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500'
}

/**
 * Reusable stat card component
 * Displays a statistic with icon, label, and optional trend
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <span
              className={`text-xs mt-2 inline-block ${
                trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
    </div>
  )
}
