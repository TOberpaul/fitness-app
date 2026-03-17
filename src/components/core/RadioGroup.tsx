import type { HTMLAttributes } from 'react'
import './RadioGroup.css'

interface RadioOption {
  value: string
  label: string
}

interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  label?: string
}

function RadioGroup({ name, options, value, onChange, label, className, ...rest }: RadioGroupProps) {
  return (
    <div className="core-input-field" role="radiogroup" aria-label={label}>
      {label && <span>{label}</span>}
      <div className={`core-radio-group${className ? ` ${className}` : ''}`} {...rest}>
        {options.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span
              className="adaptive"
              data-interactive
              {...(value === opt.value
                ? { 'data-material': 'inverted', 'data-container-contrast': 'max' }
                : {})}
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default RadioGroup
