import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  iconOnly?: boolean
}

function Button({ children, className, iconOnly, ...rest }: ButtonProps) {
  return (
    <button
      className={`button adaptive${iconOnly ? ' button--icon-only' : ''}${className ? ` ${className}` : ''}`}
      data-interactive
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
