'use client'

import { useId, useState } from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import styles from './PhoneField.module.css'

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
  /** Küçük kutu (Bilgileriniz formu ile uyumlu) */
  compact?: boolean
  /** Label border'ın üstünde (Material outlined) */
  variant?: 'default' | 'outlined'
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
  compact = false,
  variant = 'default',
}: PhoneFieldProps) {
  const genId = useId()
  const id = idProp ?? genId
  const [focused, setFocused] = useState(false)
  const hasValue = (value ?? '').trim() !== ''
  const active = focused || hasValue
  const isOutlined = variant === 'outlined'
  const minHeight = compact ? INPUT_HEIGHT_COMPACT : INPUT_HEIGHT

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        className={`${styles.wrapper} ${compact ? styles.wrapperCompact : ''} ${isOutlined ? styles.wrapperOutlined : ''}`}
        style={{
          ...WRAPPER_STYLE,
          ...(focused ? FOCUS_STYLE : {}),
          ...(error ? { borderColor: '#dc2626' } : {}),
          minHeight,
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
          className={`${styles.label} ${active ? styles.labelActive : styles.labelInactive} ${compact ? styles.labelCompact : ''} ${isOutlined && active ? styles.labelOutlined : ''}`}
          style={{
            color: active && isOutlined ? '#fc6c4f' : LABEL_COLOR,
          }}
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
}
