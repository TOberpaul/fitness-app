import type { ReactNode, HTMLAttributes } from 'react'
import './Badge.css'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  count?: ReactNode
  children: ReactNode
  color?: string
  /** Render badge count inline instead of absolute-positioned */
  inline?: boolean
}

function Badge({ count, children, color, className, inline, ...rest }: BadgeProps) {
  return (
    <div className={`core-badge${inline ? ' core-badge--inline' : ''}${className ? ` ${className}` : ''}`} {...rest}>
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
