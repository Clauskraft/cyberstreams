import React from 'react'

// Simple card container component with Tailwind CSS classes
export function Card({ 
  children, 
  className = '', 
  style 
}: { 
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties 
}) {
  return (
    <div
      className={`bg-gray-900 rounded-lg p-6 border border-gray-700 ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export default Card