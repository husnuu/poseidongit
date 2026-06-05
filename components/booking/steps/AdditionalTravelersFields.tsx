'use client'

import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import { additionalTravelerLabels } from '@/lib/bookingAdditionalTravelers'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import type { SiteLocale } from '@/lib/i18n/config'
import FloatingInput from '@/components/ui/FloatingInput'
import styles from '../booking.module.css'
import { TravelerCardTitle, TravelerGenderRow } from './TravelerGenderRow'
import type { PassengerGender } from '@/lib/bookingPassengerGender'

interface AdditionalTravelersFieldsProps {
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  errors: Record<string, string>
  onTouch?: (key: string) => void
  compact?: boolean
  variant?: 'default' | 'outlined'
  ui: BookingWizardUi
}

function travelerLabelUpper(label: string, locale: SiteLocale): string {
  const tag = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  return label.trim().toLocaleUpperCase(tag)
}

export default function AdditionalTravelersFields({
  state,
  onUpdate,
  errors,
  onTouch,
  compact = true,
  variant = 'default',
  ui,
}: AdditionalTravelersFieldsProps) {
  const labels = additionalTravelerLabels(state.counts, ui.locale)
  if (labels.length === 0) return null

  const list = state.additionalTravelers ?? []

  const setTraveler = (
    index: number,
    field: 'firstName' | 'lastName' | 'gender',
    value: string
  ) => {
    const next = [...list]
    while (next.length <= index) next.push({ firstName: '', lastName: '', gender: '' })
    next[index] = { ...next[index], [field]: value }
    onUpdate({ additionalTravelers: next })
  }

  return (
    <div className={styles.travelerCardsStack}>
      {labels.map((label, i) => (
        <article key={`${label}-${i}`} className={styles.travelerCard}>
          <TravelerCardTitle label={travelerLabelUpper(label, ui.locale)} />

          <div className={styles.formGrid2}>
            <FloatingInput
              id={`booking-traveler-${i}-firstName`}
              label={ui.labelFirstName}
              autoComplete="off"
              value={list[i]?.firstName ?? ''}
              onChange={(e) => setTraveler(i, 'firstName', e.target.value)}
              onBlur={() => onTouch?.(`traveler${i}First`)}
              error={errors[`traveler${i}First`]}
              compact={compact}
              variant={variant}
            />
            <FloatingInput
              id={`booking-traveler-${i}-lastName`}
              label={ui.labelLastName}
              autoComplete="off"
              value={list[i]?.lastName ?? ''}
              onChange={(e) => setTraveler(i, 'lastName', e.target.value)}
              onBlur={() => onTouch?.(`traveler${i}Last`)}
              error={errors[`traveler${i}Last`]}
              compact={compact}
              variant={variant}
            />
          </div>

          <TravelerGenderRow
            value={list[i]?.gender}
            onChange={(g: PassengerGender) => setTraveler(i, 'gender', g)}
            onBlur={() => onTouch?.(`traveler${i}Gender`)}
            error={errors[`traveler${i}Gender`]}
            ui={ui}
            ariaLabel={`${label} ${ui.genderAriaSuffix}`}
          />
        </article>
      ))}
    </div>
  )
}
