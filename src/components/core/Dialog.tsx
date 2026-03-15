import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import './Dialog.css'

interface DialogProps {
  /** Dialog title shown in the header */
  title: string
  /** Called when the user closes the dialog (X button or backdrop click) */
  onClose: () => void
  /** Dialog body content */
  children: ReactNode
  /** Whether the dialog is open. Default: true */
  open?: boolean
}

function Dialog({ title, onClose, children, open = true }: DialogProps) {
  if (!open) return null

  return (
    <div className="core-dialog-backdrop" onClick={onClose}>
      <dialog
        className="core-dialog adaptive"
        open
        onClick={e => e.stopPropagation()}
      >
        <div className="core-dialog-header">
          <span className="core-dialog-title">{title}</span>
          <button
            className="core-dialog-close"
            data-interactive
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </dialog>
    </div>
  )
}

export default Dialog
