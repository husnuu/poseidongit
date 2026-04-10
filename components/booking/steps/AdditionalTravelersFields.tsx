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
  /** StepCustomer: compact + default variant; Step3: outlined */
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

  const setTraveler = (index: number, field: 'firstName' | 'lastName' | 'mealPreferenceKey', value: string) => {
    const next = [...list]
    while (next.length <= index) next.push({ firstName: '', lastName: '', mealPreferenceKey: '' })
    next[index] = { ...next[index], [field]: value }
    onUpdate({ additionalTravelers: next })
  }

  return (
    <div className="space-y-5 border-t border-zinc-200/80 pt-5 mt-2">
      <div>
        <p className="text-sm font-medium text-zinc-800">{ui.otherGuestsTitle}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{ui.otherGuestsHint}</p>
      </div>
      {labels.map((label, i) => (
        <div key={`${label}-${i}`} className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {mealOptions && mealOptions.length > 0 && (
            <div>
              <MealOptionSelect
                options={mealOptions}
                value={list[i]?.mealPreferenceKey ?? ''}
                onChange={(key) => setTraveler(i, 'mealPreferenceKey', key)}
                ariaLabel={`${label} ${ui.mealPreferenceAriaSuffix}`}
                label={ui.labelMealPreference}
                namePrefix={`booking-traveler-${i}-meal`}
                showError={Boolean(errors[`traveler${i}Meal`])}
              />
              {errors[`traveler${i}Meal`] ? (
                <p className={styles.errorText}>{errors[`traveler${i}Meal`]}</p>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
