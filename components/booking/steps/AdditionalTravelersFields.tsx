'use client'

import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import { additionalTravelerLabels } from '@/lib/bookingAdditionalTravelers'
import FloatingInput from '@/components/ui/FloatingInput'

interface AdditionalTravelersFieldsProps {
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  errors: Record<string, string>
  /** StepCustomer: compact + default variant; Step3: outlined */
  compact?: boolean
  variant?: 'default' | 'outlined'
}

export default function AdditionalTravelersFields({
  state,
  onUpdate,
  errors,
  compact = true,
  variant = 'default',
}: AdditionalTravelersFieldsProps) {
  const labels = additionalTravelerLabels(state.counts)
  if (labels.length === 0) return null

  const list = state.additionalTravelers ?? []

  const setTraveler = (index: number, field: 'firstName' | 'lastName', value: string) => {
    const next = [...list]
    while (next.length <= index) next.push({ firstName: '', lastName: '' })
    next[index] = { ...next[index], [field]: value }
    onUpdate({ additionalTravelers: next })
  }

  return (
    <div className="space-y-5 border-t border-zinc-200/80 pt-5 mt-2">
      <div>
        <p className="text-sm font-medium text-zinc-800">Diğer yolcular</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Rezervasyonu yapan kişi dışındaki katılımcıların ad ve soyadını girin.
        </p>
      </div>
      {labels.map((label, i) => (
        <div key={`${label}-${i}`} className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              id={`booking-traveler-${i}-firstName`}
              label="Ad *"
              autoComplete="off"
              value={list[i]?.firstName ?? ''}
              onChange={(e) => setTraveler(i, 'firstName', e.target.value)}
              error={errors[`traveler${i}First`]}
              compact={compact}
              variant={variant}
            />
            <FloatingInput
              id={`booking-traveler-${i}-lastName`}
              label="Soyad *"
              autoComplete="off"
              value={list[i]?.lastName ?? ''}
              onChange={(e) => setTraveler(i, 'lastName', e.target.value)}
              error={errors[`traveler${i}Last`]}
              compact={compact}
              variant={variant}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
