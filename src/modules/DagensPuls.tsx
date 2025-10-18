import React from 'react'
import { useDataFetching } from '@hooks/useDataFetching'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { PulseHeader } from './DagensPuls/PulseHeader'
import { PulseList } from './DagensPuls/PulseList'
import { mockPulseData } from '@data/mockPulseData'
import type { PulseItem } from '@types/pulse.types'

/**
 * Dagens Puls (Daily Pulse) - Real-time threat intelligence feed
 *
 * Refactored with:
 * - useDataFetching hook for data management
 * - Separated PulseHeader and PulseList components
 * - Centralized mock data
 * - Type-safe interfaces
 */
export const DagensPuls: React.FC = () => {
  // Use custom hook for data fetching
  const { data: pulseData, loading, error } = useDataFetching<PulseItem>({
    url: '/api/pulse',
    fallbackData: mockPulseData,
    transform: (data) => data
  })

  // Handle loading state
  if (loading) {
    return <LoadingSpinner size="md" message="Loading threat intelligence..." />
  }

  // Handle error state (fallback to mock data)
  if (error && pulseData.length === 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        Failed to load threat data: {error.message}
      </div>
    )
  }

  // Render main component
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
      <PulseHeader />
      <PulseList items={pulseData} />
    </div>
  )
}

export { DagensPuls as default }
