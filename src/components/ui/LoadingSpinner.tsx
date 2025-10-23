import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8 border-b-2',
  md: 'h-12 w-12 border-b-2',
  lg: 'h-16 w-16 border-b-2'
}

/**
 * Reusable loading spinner component
 * Displays a loading state with optional message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Loading...',
  fullScreen = false
}) => {
  const spinnerContainer = (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-cyber-blue ${sizeClasses[size]}`}></div>
      {message && <p className="mt-4 text-gray-400 text-sm">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-cyber-dark/90 backdrop-blur-sm flex items-center justify-center z-50">
        {spinnerContainer}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
      {spinnerContainer}
    </div>
  )
}
