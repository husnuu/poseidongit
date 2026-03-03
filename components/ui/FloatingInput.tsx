'use client'

import { useId, useState, forwardRef } from 'react'

const WRAPPER_STYLE = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#e5e7eb',
  borderRadius: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
}
const FOCUS_STYLE = {
  borderColor: '#2168b8',
  boxShadow: '0 0 0 2px rgba(33,104,184,0.15)',
}
const INPUT_HEIGHT = 56
const LABEL_COLOR = '#6b7280'

export interface FloatingInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string
  error?: string
  /** Optional, for react-hook-form */
  wrapperClassName?: string
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput({
  label,
  id: idProp,
  value,
  defaultValue,
  error,
  className = '',
  wrapperClassName = '',
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

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        className="relative w-full transition-[border-color,box-shadow] duration-150"
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
          className={`w-full bg-transparent pt-5 pb-2 px-4 text-[#111] outline-none rounded-xl ${className}`}
          style={{
            height: INPUT_HEIGHT,
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 20,
            paddingBottom: 8,
            fontSize: 15,
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
          style={{
            color: LABEL_COLOR,
            ...(active
              ? {
                  top: 8,
                  fontSize: 11,
                  fontWeight: 500,
                }
              : {
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 13,
                }),
          }}
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
