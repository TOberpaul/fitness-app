import type { ReactNode, HTMLAttributes } from 'react'
import './Badge.css'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  count?: ReactNode
  children: ReactNode
  color?: string
}

function Badge({ count, children, color, className, ...rest }: BadgeProps) {
  return (
    <div className={`core-badge${className ? ` ${className}` : ''}`} {...rest}>
      {children}
      {count != null && (
        <span
          className="core-badge-count adaptive"
          data-size="xs"
          data-material="inverted"
          data-container-contrast="max"
          {...(color ? { 'data-color': color } : {})}
        >
          {count}
        </span>
      )}
    </div>
  )
}

export default Badge
