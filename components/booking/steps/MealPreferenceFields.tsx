'use client'

import { useEffect } from 'react'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import styles from '../booking.module.css'
import MealOptionSelect from './MealOptionSelect'

export function isTourMealMenuActive(tour: TourForBooking): boolean {
  const mm = tour.mealMenu
  const options = (mm?.options ?? []).filter((o) => o.key?.trim() && o.label?.trim())
  return Boolean(mm?.enabled && options.length > 0)
}

export function tourMealOptions(tour: TourForBooking): Array<{ key: string; label: string }> {
  return (tour.mealMenu?.options ?? [])
    .filter((o) => o.key?.trim() && o.label?.trim())
    .map((o) => ({ key: o.key!.trim(), label: o.label!.trim() }))
}

function mealOptions(tour: TourForBooking, fallbackTitle?: string) {
  const mm = tour.mealMenu
  const options = tourMealOptions(tour)
  const active = Boolean(mm?.enabled && options.length > 0)
  return {
    active,
    options,
    sectionTitle: mm?.sectionTitle?.trim() || fallbackTitle?.trim() || 'Yemek tercihi',
    description: mm?.description?.trim() || '',
  }
}

interface MealPreferenceFieldsProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  error?: string
  /** CMS başlığı yokken (ör. İngilizce arayüz). */
  mealFallbackTitle?: string
}

export default function MealPreferenceFields({
  tour,
  state,
  onUpdate,
  error,
  mealFallbackTitle,
}: MealPreferenceFieldsProps) {
  const { active, options, sectionTitle, description } = mealOptions(tour, mealFallbackTitle)

  const firstOptionKey = options[0]?.key?.trim() ?? ''

  useEffect(() => {
    if (!active) {
      if (state.mealPreferenceKey) onUpdate({ mealPreferenceKey: undefined })
      return
    }
    if (options.length === 1 && firstOptionKey && state.mealPreferenceKey !== firstOptionKey) {
      onUpdate({ mealPreferenceKey: firstOptionKey })
    }
  }, [active, options.length, firstOptionKey, state.mealPreferenceKey, onUpdate])

  if (!active) return null

  return (
    <div style={{ marginBottom: 20 }}>
      {description ? <p className={styles.mealOptionDescription}>{description}</p> : null}
      <MealOptionSelect
        options={options.map((o) => ({ key: o.key!.trim(), label: o.label! }))}
        value={state.mealPreferenceKey ?? ''}
        onChange={(key) => onUpdate({ mealPreferenceKey: key || undefined })}
        ariaLabel={sectionTitle}
        label={`${sectionTitle} *`}
        namePrefix="booking-meal"
        showError={Boolean(error)}
      />
      {error ? (
        <p className={styles.errorText} style={{ marginTop: 6 }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
