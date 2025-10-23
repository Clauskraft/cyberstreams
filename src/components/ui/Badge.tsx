import React from 'react'

export interface BadgeProps {
  variant: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'default'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  info: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  default: 'text-gray-400 bg-gray-500/10 border-gray-500/20'
}

/**
 * Reusable badge component
 * Displays severity or status badges with consistent styling
 */
export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full border inline-flex items-center ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
