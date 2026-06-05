'use client'

import { useId, useState, forwardRef } from 'react'

const WRAPPER_STYLE = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#e2e8f0',
  borderRadius: 10,
  boxShadow: 'none',
}
const FOCUS_STYLE = {
  borderColor: '#fc6c4f',
  boxShadow: '0 0 0 2px rgba(252,108,79,0.1)',
}
const LABEL_COLOR = '#94a3b8'
const LABEL_COLOR_FOCUS = '#fc6c4f'

export interface FloatingTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  label: string
  error?: string
  wrapperClassName?: string
  /** Label border'ın üstünde (Material outlined) */
  variant?: 'default' | 'outlined'
}

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(function FloatingTextarea({
  label,
  id: idProp,
  value,
  defaultValue,
  error,
  className = '',
  wrapperClassName = '',
  variant = 'default',
  onFocus,
  onBlur,
  onChange,
  rows = 4,
  ...rest
}, ref) {
  const genId = useId()
  const id = idProp ?? genId
  const [focused, setFocused] = useState(false)
  const isControlled = value !== undefined
  const hasValue = isControlled
    ? value !== null && String(value).trim() !== ''
    : undefined
  const [uncontrolledVal, setUncontrolledVal] = useState('')
  const effectiveHasValue =
    hasValue !== undefined
      ? hasValue
      : (defaultValue != null && String(defaultValue).trim() !== '') || uncontrolledVal.trim() !== ''

  const active = focused || effectiveHasValue
  const isOutlined = variant === 'outlined'
  const outlinedActive = isOutlined && active

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        className={`relative w-full transition-[border-color,box-shadow] duration-150 rounded-lg ${isOutlined ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{
          ...WRAPPER_STYLE,
          ...(focused ? FOCUS_STYLE : {}),
          ...(error ? { borderColor: '#dc2626' } : {}),
        }}
      >
        <textarea
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          rows={rows}
          className={`w-full bg-transparent resize-y outline-none rounded-xl ${className}`}
          style={{
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: isOutlined ? 16 : (active ? 22 : 14),
            paddingBottom: 12,
            fontSize: 16,
            minHeight: isOutlined ? 96 : 108,
            color: '#475569',
          }}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          onChange={(e) => {
            if (!isControlled) setUncontrolledVal(e.target.value)
            onChange?.(e)
          }}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        <label
          htmlFor={id}
          className="absolute left-4 pointer-events-none transition-all duration-200 origin-left"
          style={
            outlinedActive
              ? {
                  top: -9,
                  left: 12,
                  zIndex: 2,
                  background: 'var(--floating-label-bg, #fff)',
                  padding: '0 5px',
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: focused ? LABEL_COLOR_FOCUS : LABEL_COLOR,
                }
              : {
                  color: LABEL_COLOR,
                  zIndex: 1,
                  ...(active
                    ? {
                        top: 10,
                        left: 16,
                        fontSize: 11,
                        fontWeight: 500,
                      }
                    : {
                        top: 18,
                        left: 16,
                        fontSize: 13,
                      }),
                }
          }
        >
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default FloatingTextarea
