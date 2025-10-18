import React from 'react'

type ButtonVariant = 'default' | 'danger'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  className?: string
}

// Generic button component with Tailwind CSS styling
export function Button({ 
  variant = 'default', 
  children, 
  className = '',
  style, 
  ...rest 
}: Props) {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold cursor-pointer border-none transition-all'
  const variantClasses = {
    default: 'bg-cyber-blue hover:bg-cyber-blue/80 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      style={style} 
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button