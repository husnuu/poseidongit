'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { validateAdditionalTravelers } from '@/lib/bookingAdditionalTravelers'
import { validatePassengerGenders } from '@/lib/bookingPassengerGender'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'

const PHONE_MIN_LENGTH = 10
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function computePassengerErrors(
  state: BookingWizardState,
  ui: BookingWizardUi
): Record<string, string> {
  const next: Record<string, string> = {}
  const c = state.customer
  const v = ui.validation
  if (!c.firstName?.trim()) next.firstName = v.firstName
  if (!c.lastName?.trim()) next.lastName = v.lastName
  if (!c.email?.trim()) next.email = v.emailRequired
  else if (!EMAIL_REGEX.test(c.email)) next.email = v.emailInvalid
  const phoneDigits = (c.phone ?? '').replace(/\D/g, '')
  if (!phoneDigits.length) next.phone = v.phoneRequired
  else if (phoneDigits.length < PHONE_MIN_LENGTH) next.phone = v.phoneInvalid
  Object.assign(
    next,
    validateAdditionalTravelers(state.additionalTravelers, state.counts, {
      messages: { firstName: v.travelerFirst, lastName: v.travelerLast },
    })
  )
  Object.assign(next, validatePassengerGenders(state, { gender: v.gender }))
  return next
}

export function useBookingPassengerValidation(
  state: BookingWizardState,
  ui: BookingWizardUi,
  onValidationChange: (valid: boolean) => void
) {
  const [touched, setTouched] = useState<Set<string>>(() => new Set())
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const allErrors = useMemo(() => computePassengerErrors(state, ui), [state, ui])

  useEffect(() => {
    onValidationChange(Object.keys(allErrors).length === 0)
  }, [allErrors, onValidationChange])

  const touch = useCallback((key: string) => {
    setTouched((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const touchAll = useCallback(() => {
    setSubmitAttempted(true)
    setTouched((prev) => {
      const next = new Set(prev)
      for (const key of Object.keys(allErrors)) next.add(key)
      return next
    })
  }, [allErrors])

  const visibleErrors = useMemo(() => {
    const out: Record<string, string> = {}
    for (const [key, message] of Object.entries(allErrors)) {
      if (submitAttempted || touched.has(key)) out[key] = message
    }
    return out
  }, [allErrors, touched, submitAttempted])

  const attemptSubmit = useCallback(() => {
    setSubmitAttempted(true)
    setTouched((prev) => {
      const next = new Set(prev)
      for (const key of Object.keys(allErrors)) next.add(key)
      return next
    })
    return Object.keys(allErrors).length === 0
  }, [allErrors])

  return { visibleErrors, touch, touchAll, attemptSubmit, allErrors }
}
