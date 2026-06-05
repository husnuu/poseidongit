'use client'

import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import type { PassengerGender } from '@/lib/bookingPassengerGender'
import { TravelerCardTitle, TravelerGenderRow } from './TravelerGenderRow'
import styles from '../booking.module.css'

interface PassengerGenderFieldsProps {
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  errors: Record<string, string>
  onTouch?: (key: string) => void
  ui: BookingWizardUi
}

/** Bebek cinsiyetleri — ayrı kartlar. */
export default function PassengerGenderFields({
  state,
  onUpdate,
  errors,
  onTouch,
  ui,
}: PassengerGenderFieldsProps) {
  if (state.counts.baby <= 0) return null

  const setInfantGender = (index: number, gender: PassengerGender) => {
    const next = [...(state.infantGenders ?? [])]
    while (next.length <= index) next.push('')
    next[index] = gender
    onUpdate({ infantGenders: next })
  }

  const localeTag = ui.locale === 'tr' ? 'tr-TR' : ui.locale === 'de' ? 'de-DE' : 'en-US'

  return (
    <div className={styles.travelerCardsStack}>
      {Array.from({ length: state.counts.baby }, (_, i) => (
        <article key={`infant-gender-${i}`} className={styles.travelerCard}>
          <TravelerCardTitle label={ui.infantGenderLabel(i + 1).toLocaleUpperCase(localeTag)} />
          <TravelerGenderRow
            value={state.infantGenders?.[i]}
            onChange={(g) => setInfantGender(i, g)}
            onBlur={() => onTouch?.(`infant${i}Gender`)}
            error={errors[`infant${i}Gender`]}
            ui={ui}
            ariaLabel={ui.infantGenderLabel(i + 1)}
          />
        </article>
      ))}
    </div>
  )
}
