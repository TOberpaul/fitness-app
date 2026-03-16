import type { ReactNode, HTMLAttributes } from 'react'
import './Card.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={`core-card adaptive${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </div>
  )
}

export default Card
