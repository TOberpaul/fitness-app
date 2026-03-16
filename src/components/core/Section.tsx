import type { ReactNode, HTMLAttributes } from 'react'
import './Section.css'

interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string
  children: ReactNode
}

function Section({ title, children, className, ...rest }: SectionProps) {
  return (
    <section className={`core-section${className ? ` ${className}` : ''}`} {...rest}>
      {title && <h2 className="core-section-title">{title}</h2>}
      {children}
    </section>
  )
}

export default Section
