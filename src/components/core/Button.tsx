import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

function Button({ children, className, ...rest }: ButtonProps) {
  return (
    <button
      className={`button adaptive${className ? ` ${className}` : ''}`}
      data-interactive
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
