import React from 'react'
import { InboxIcon, type LucideIcon } from 'lucide-react'

export interface NoDataProps {
  title?: string
  message?: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
}

const NoData: React.FC<NoDataProps> = ({
  title = 'Ingen data',
  message = 'Ingen data at vise endnu.',
  icon: Icon = InboxIcon,
  action
}) => {
  return (
    <div className="bg-gray-900/50 rounded-lg p-12 border-2 border-dashed border-gray-700 text-center">
      <Icon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default NoData



