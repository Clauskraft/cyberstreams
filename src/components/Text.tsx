import React from 'react'

// Basic text component with support for a small set of variants
export function Text({ 
  children, 
  variant = 'body', 
  className = '',
  style 
}: { 
  children: React.ReactNode
  variant?: 'body' | 'title' | 'subtitle'
  className?: string
  style?: React.CSSProperties 
}) {
  const baseClasses = 'text-gray-100'
  const variantClasses = {
    body: 'text-base leading-relaxed',
    title: 'text-2xl font-bold leading-tight',
    subtitle: 'text-lg font-semibold leading-snug'
  }
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export default Text