'use client'

import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import type { PassengerGender } from '@/lib/bookingPassengerGender'
import GenderSelect from './GenderSelect'
import FormFieldError from './FormFieldError'
import styles from '../booking.module.css'

export function TravelerCardTitle({ label }: { label: string }) {
  return <h4 className={styles.travelerCardTitle}>{label}</h4>
}

interface TravelerGenderRowProps {
  value: PassengerGender | '' | undefined
  onChange: (gender: PassengerGender) => void
  onBlur?: () => void
  error?: string
  ui: BookingWizardUi
  ariaLabel: string
}

export function TravelerGenderRow({
  value,
  onChange,
  onBlur,
  error,
  ui,
  ariaLabel,
}: TravelerGenderRowProps) {
  return (
    <div className={styles.travelerGenderRow} onBlur={onBlur}>
      <p className={styles.travelerGenderLabel} id={`${ariaLabel}-label`}>
        {ui.labelGender} *
      </p>
      <GenderSelect
        value={value}
        onChange={(g) => {
          onChange(g)
          onBlur?.()
        }}
        maleLabel={ui.genderMale}
        femaleLabel={ui.genderFemale}
        ariaLabel={ariaLabel}
        showError={Boolean(error)}
      />
      <FormFieldError message={error} />
    </div>
  )
}
