'use client'

import { useId, useState } from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import styles from './PhoneField.module.css'

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

export interface PhoneFieldProps {
  label?: string
  value?: string
  onChange?: (value: string | undefined) => void
  onBlur?: () => void
  error?: string
  id?: string
  name?: string
  disabled?: boolean
  wrapperClassName?: string
  defaultCountry?: 'TR' | 'US' | 'GB' | string
}

export default function PhoneField({
  label = 'Phone Number',
  value = '',
  onChange,
  onBlur,
  error,
  id: idProp,
  name,
  disabled,
  wrapperClassName = '',
  defaultCountry = 'TR',
}: PhoneFieldProps) {
  const genId = useId()
  const id = idProp ?? genId
  const [focused, setFocused] = useState(false)
  const hasValue = (value ?? '').trim() !== ''
  const active = focused || hasValue

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        className={styles.wrapper}
        style={{
          ...WRAPPER_STYLE,
          ...(focused ? FOCUS_STYLE : {}),
          ...(error ? { borderColor: '#dc2626' } : {}),
          minHeight: INPUT_HEIGHT,
        }}
      >
        <PhoneInput
          international
          defaultCountry={defaultCountry as 'TR'}
          value={value || undefined}
          onChange={(v) => onChange?.(v ?? undefined)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            onBlur?.()
          }}
          disabled={disabled}
          numberInputProps={{
            id,
            name,
            'aria-invalid': !!error,
            'aria-describedby': error ? `${id}-error` : undefined,
          }}
        />
        <label
          htmlFor={id}
          className={`${styles.label} ${active ? styles.labelActive : styles.labelInactive}`}
          style={{ color: LABEL_COLOR }}
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
}
