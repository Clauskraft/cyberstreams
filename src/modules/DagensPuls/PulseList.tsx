import React from 'react'
import { PulseCard } from './PulseCard'
import { EmptyState } from '@components/ui/EmptyState'
import type { PulseItem } from '@types/pulse.types'

interface PulseListProps {
  items: PulseItem[]
}

/**
 * List of pulse items
 * Renders PulseCard for each item
 */
export const PulseList: React.FC<PulseListProps> = ({ items }) => {
  if (items.length === 0) {
    return <EmptyState message="No threats available right now" title="No Data" />
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <PulseCard key={item.id} item={item} />
      ))}
    </div>
  )
}
