import type { ReactNode, HTMLAttributes } from 'react'
import './Notification.css'

interface NotificationProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  children: ReactNode
}

function Notification({ icon, children, className, ...rest }: NotificationProps) {
  return (
    <div className={`core-notification adaptive${className ? ` ${className}` : ''}`} {...rest}>
      {icon && <span className="core-notification-icon">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

export default Notification
