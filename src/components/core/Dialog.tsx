import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { dialogVariants, backdropVariants } from '../../animations/presets'
import { useReducedMotion, getVariants } from '../../animations/hooks'
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
  const reducedMotion = useReducedMotion()
  const backdrop = getVariants(backdropVariants, reducedMotion)
  const dialog = getVariants(dialogVariants, reducedMotion)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (open) {
      root.setAttribute('inert', '')
      dialogRef.current?.focus()
    } else {
      root.removeAttribute('inert')
    }
    return () => root.removeAttribute('inert')
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="core-dialog-backdrop"
          data-size="xl"
          onClick={onClose}
          variants={backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          key="dialog-backdrop"
        >
          <motion.dialog
            ref={dialogRef}
            className="core-dialog adaptive"
            open
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
            variants={dialog}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="core-dialog-header">
              <span className="core-dialog-title">{title}</span>
              <button
                className="core-dialog-close"
                data-interactive
                onClick={onClose}
                aria-label="Schließen"
              >
                <X />
              </button>
            </div>
            {children}
          </motion.dialog>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default Dialog
