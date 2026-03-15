import './EmptyState.css'

interface EmptyStateProps {
  icon: React.ReactNode
  message: string
  ctaLabel: string
  onCtaClick: () => void
}

function EmptyState({ icon, message, ctaLabel, onCtaClick }: EmptyStateProps) {
  return (
    <div className="empty-state adaptive">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-message">{message}</p>
      <button
        className="empty-state-cta adaptive"
        data-interactive
        onClick={onCtaClick}
      >
        {ctaLabel}
      </button>
    </div>
  )
}

export default EmptyState
