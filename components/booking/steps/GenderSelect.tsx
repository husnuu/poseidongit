'use client'

import type { PassengerGender } from '@/lib/bookingPassengerGender'
import styles from '../booking.module.css'

interface GenderSelectProps {
  value: PassengerGender | '' | undefined
  onChange: (gender: PassengerGender) => void
  maleLabel: string
  femaleLabel: string
  ariaLabel: string
  showError?: boolean
}

export default function GenderSelect({
  value,
  onChange,
  maleLabel,
  femaleLabel,
  ariaLabel,
  showError,
}: GenderSelectProps) {
  const invalid = Boolean(showError && !value)

  return (
    <div
      className={`${styles.genderSegment} ${invalid ? styles.genderSegmentError : ''}`}
      role="group"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
    >
      <button
        type="button"
        className={`${styles.genderSegmentBtn} ${value === 'male' ? styles.genderSegmentBtnActive : ''}`}
        aria-pressed={value === 'male'}
        onClick={() => onChange('male')}
      >
        {maleLabel}
      </button>
      <button
        type="button"
        className={`${styles.genderSegmentBtn} ${value === 'female' ? styles.genderSegmentBtnActive : ''}`}
        aria-pressed={value === 'female'}
        onClick={() => onChange('female')}
      >
        {femaleLabel}
      </button>
    </div>
  )
}
