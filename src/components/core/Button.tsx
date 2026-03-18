import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  iconOnly?: boolean
  width?: 'auto' | 'full'
  variant?: 'default' | 'primary'
}

function Button({ children, className, iconOnly, width, variant, ...rest }: ButtonProps) {
  const variantProps = variant === 'primary'
    ? { 'data-material': 'inverted' as const, 'data-container-contrast': 'max' as const }
    : {}

  return (
    <button
      className={`button adaptive${iconOnly ? ' button--icon-only' : ''}${width === 'full' ? ' button--full' : ''}${className ? ` ${className}` : ''}`}
      data-interactive
      {...variantProps}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
