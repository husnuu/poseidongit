'use client'

import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import { additionalTravelerLabels } from '@/lib/bookingAdditionalTravelers'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import FloatingInput from '@/components/ui/FloatingInput'
import styles from '../booking.module.css'
import MealOptionSelect from './MealOptionSelect'

interface AdditionalTravelersFieldsProps {
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  errors: Record<string, string>
  mealOptions?: Array<{ key: string; label: string }>
  compact?: boolean
  variant?: 'default' | 'outlined'
  ui: BookingWizardUi
}

export default function AdditionalTravelersFields({
  state,
  onUpdate,
  errors,
  mealOptions,
  compact = true,
  variant = 'default',
  ui,
}: AdditionalTravelersFieldsProps) {
  const labels = additionalTravelerLabels(state.counts, ui.locale)
  if (labels.length === 0) return null

  const list = state.additionalTravelers ?? []

  const setTraveler = (
    index: number,
    field: 'firstName' | 'lastName' | 'mealPreferenceKey',
    value: string
  ) => {
    const next = [...list]
    while (next.length <= index) next.push({ firstName: '', lastName: '', mealPreferenceKey: '' })
    next[index] = { ...next[index], [field]: value }
    onUpdate({ additionalTravelers: next })
  }

  return (
    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, marginTop: 8 }}>
      {/* Başlık */}
      <div style={{ marginBottom: 16 }}>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#1e3a5f',
          margin: '0 0 3px',
          fontFamily: 'var(--font-family)',
        }}>
          {ui.otherGuestsTitle}
        </p>
        <p style={{
          fontSize: 12,
          color: '#94A3B8',
          margin: 0,
          fontFamily: 'var(--font-family)',
        }}>
          {ui.otherGuestsHint}
        </p>
      </div>

      {/* Her yolcu */}
      {labels.map((label, i) => (
        <div
          key={`${label}-${i}`}
          style={{
            marginBottom: i < labels.length - 1 ? 20 : 0,
            paddingBottom: i < labels.length - 1 ? 20 : 0,
            borderBottom: i < labels.length - 1 ? '1px dashed #F1F5F9' : 'none',
          }}
        >
          {/* Yolcu numarası etiketi */}
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#94A3B8',
            margin: '0 0 10px',
            fontFamily: 'var(--font-family)',
          }}>
            {label}
          </p>

          {/* Ad — Soyad */}
          <div className={styles.formGrid2}>
            <FloatingInput
              id={`booking-traveler-${i}-firstName`}
              label={ui.labelFirstName}
              autoComplete="off"
              value={list[i]?.firstName ?? ''}
              onChange={(e) => setTraveler(i, 'firstName', e.target.value)}
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
              error={errors[`traveler${i}Last`]}
              compact={compact}
              variant={variant}
            />
          </div>

          {/* Yemek tercihi */}
          {mealOptions && mealOptions.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <MealOptionSelect
                options={mealOptions}
                value={list[i]?.mealPreferenceKey ?? ''}
                onChange={(key) => setTraveler(i, 'mealPreferenceKey', key)}
                ariaLabel={`${label} ${ui.mealPreferenceAriaSuffix}`}
                label={ui.labelMealPreference}
                namePrefix={`booking-traveler-${i}-meal`}
                showError={Boolean(errors[`traveler${i}Meal`])}
              />
              {errors[`traveler${i}Meal`] && (
                <p className={styles.errorText}>{errors[`traveler${i}Meal`]}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
