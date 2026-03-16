import type { InputHTMLAttributes } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

function Input({ label, error, id, className, ...rest }: InputProps) {
  return (
    <div className="core-input-field">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={`core-input adaptive${className ? ` ${className}` : ''}`}
        aria-invalid={!!error || undefined}
        {...rest}
      />
      {error && <span className="core-input-error" role="alert">{error}</span>}
    </div>
  )
}

export default Input
