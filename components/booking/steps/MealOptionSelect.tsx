'use client'

import styles from '../booking.module.css'

export interface MealOptionItem {
  key: string
  label: string
}

interface MealOptionSelectProps {
  options: MealOptionItem[]
  value: string
  onChange: (key: string) => void
  ariaLabel: string
  label?: string
  /** Benzersiz id öneki (her yolcu satırı için farklı olmalı). */
  namePrefix: string
  /** Validasyon hatası: seçim yokken çerçeve vurgusu. */
  showError?: boolean
}

export default function MealOptionSelect({
  options,
  value,
  onChange,
  ariaLabel,
  label = 'Yemek tercihi *',
  namePrefix,
  showError,
}: MealOptionSelectProps) {
  const id = `${namePrefix}-select`
  const invalid = Boolean(showError && !value.trim())

  return (
    <div className={styles.mealOptionField}>
      <select
        id={id}
        className={`${styles.input} ${styles.select} ${styles.mealOptionSelect} ${invalid ? styles.inputError : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        style={{ width: '100%' }}
      >
        <option value="">Seçin</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <label htmlFor={id} className={styles.mealOptionFloatingLabel}>
        {label}
      </label>
    </div>
  )
}
