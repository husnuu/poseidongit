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
const INPUT_HEIGHT = 52
const INPUT_HEIGHT_COMPACT = 42
const LABEL_COLOR = '#94a3b8'
const LABEL_COLOR_FOCUS = '#fc6c4f'

export interface FloatingInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string
  error?: string
  /** Optional, for react-hook-form */
  wrapperClassName?: string
  /** Küçük kutu (bilet.com tarzı) */
  compact?: boolean
  /** Label border'ın üstünde (Material outlined) */
  variant?: 'default' | 'outlined'
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput({
  label,
  id: idProp,
  value,
  defaultValue,
  error,
  className = '',
  wrapperClassName = '',
  compact = false,
  variant = 'default',
  onFocus,
  onBlur,
  onChange,
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
  const height = compact ? INPUT_HEIGHT_COMPACT : INPUT_HEIGHT
  const paddingX = compact ? 11 : 14
  const paddingTop = isOutlined ? (compact ? 13 : 18) : (compact ? 12 : 18)
  const paddingBottom = compact ? 5 : 7
  /* En az 16px: mobilde (iOS) focus’ta zoom’u engeller */
  const inputFontSize = 16
  /* Sol üstte, kutunun kenarının içinde (border içi) */
  const labelInsetTop = compact ? 7 : 9
  const labelInsetLeft = paddingX
  const labelFontSizeActive = 11
  const labelFontSizeInactive = compact ? 13 : 13

  const outlinedActive = isOutlined && active

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        className={`relative w-full transition-[border-color,box-shadow] duration-150 ${isOutlined ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{
          ...WRAPPER_STYLE,
          ...(focused ? FOCUS_STYLE : {}),
          ...(error ? { borderColor: '#dc2626' } : {}),
        }}
      >
        <input
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          className={`w-full bg-transparent text-[#475569] outline-none ${className}`}
          style={{
            height,
            paddingLeft: paddingX,
            paddingRight: paddingX,
            paddingTop,
            paddingBottom,
            fontSize: inputFontSize,
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
          className="absolute pointer-events-none transition-all duration-200 origin-left"
          style={
            outlinedActive
              ? {
                  top: -9,
                  left: Math.max(labelInsetLeft - 2, 8),
                  zIndex: 2,
                  background: 'var(--floating-label-bg, #fff)',
                  padding: '0 5px',
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: focused ? LABEL_COLOR_FOCUS : LABEL_COLOR,
                }
              : {
                  left: labelInsetLeft,
                  zIndex: 1,
                  color: LABEL_COLOR,
                  ...(active
                    ? {
                        top: labelInsetTop,
                        fontSize: labelFontSizeActive,
                        fontWeight: 500,
                      }
                    : {
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: labelFontSizeInactive,
                      }),
                }
          }
        >
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11px] leading-snug text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default FloatingInput
