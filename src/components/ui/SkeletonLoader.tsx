import React from 'react'

export interface SkeletonLoaderProps {
  count?: number
  height?: 'sm' | 'md' | 'lg'
  className?: string
}

const heightClasses = {
  sm: 'h-4',
  md: 'h-8',
  lg: 'h-12'
}

/**
 * Reusable skeleton loader component
 * Displays placeholder content while data is loading
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  height = 'md',
  className = ''
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${heightClasses[height]} bg-gray-800 rounded-lg animate-pulse ${className}`}
        ></div>
      ))}
    </div>
  )
}
