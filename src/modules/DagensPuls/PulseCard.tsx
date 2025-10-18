import React from 'react'
import { Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { Badge } from '@components/ui/Badge'
import type { PulseItem } from '@types/pulse.types'

interface PulseCardProps {
  item: PulseItem
}

/**
 * Individual pulse item card
 * Displays severity badge, title, description, metadata
 */
export const PulseCard: React.FC<PulseCardProps> = ({ item }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {/* Badge and Category */}
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant={item.severity}>{item.severity.toUpperCase()}</Badge>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 font-medium">
              {item.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-1 group-hover:text-cyber-blue transition-colors">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-3">{item.description}</p>

          {/* Metadata */}
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

        {/* External Link Button */}
        {item.url && (
          <button className="ml-4 p-2 rounded-lg hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100">
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}
