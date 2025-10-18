import React from 'react'
import { TrendingUp } from 'lucide-react'

/**
 * Header for Dagens Puls module
 * Shows title, subtitle, and live status indicator
 */
export const PulseHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Title Section */}
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-cyber-blue/10 border border-cyber-blue/20">
          <TrendingUp className="w-6 h-6 text-cyber-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Dagens Puls</h2>
          <p className="text-sm text-gray-400">Real-time threat intelligence feed</p>
        </div>
      </div>

      {/* Live Status Indicator */}
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-green-400 font-medium">UPDATING</span>
      </div>
    </div>
  )
}
