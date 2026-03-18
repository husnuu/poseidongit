'use client'

import { useId, useState, forwardRef } from 'react'

const WRAPPER_STYLE = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#e2e8f0',
  borderRadius: 12,
  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
}
const FOCUS_STYLE = {
  borderColor: '#2563eb',
  boxShadow: '0 0 0 3px rgba(37,99,235,0.12)',
}
const INPUT_HEIGHT = 56
const INPUT_HEIGHT_COMPACT = 44
const LABEL_COLOR = '#6b7280'
const LABEL_COLOR_FOCUS = '#2563eb'

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
  const paddingX = compact ? 12 : 16
  const paddingTop = isOutlined ? (compact ? 16 : 20) : (compact ? 14 : 20)
  const paddingBottom = compact ? 6 : 8
  /* En az 16px: mobilde (iOS) focus’ta zoom’u engeller */
  const inputFontSize = 16
  /* Sol üstte, kutunun kenarının içinde (border içi) */
  const labelInsetTop = compact ? 7 : 9
  const labelInsetLeft = paddingX
  const labelFontSizeActive = 11
  const labelFontSizeInactive = compact ? 13 : 13

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        className="relative w-full transition-[border-color,box-shadow] duration-150 overflow-visible"
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
          className={`w-full bg-transparent text-[#334155] outline-none rounded-[5px] ${className}`}
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
            isOutlined
              ? {
                  top: -10,
                  left: labelInsetLeft,
                  background: '#fff',
                  padding: '0 6px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: focused || effectiveHasValue ? LABEL_COLOR_FOCUS : LABEL_COLOR,
                }
              : {
                  left: labelInsetLeft,
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
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default FloatingInput
