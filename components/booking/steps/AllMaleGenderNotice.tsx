'use client'

import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import { allPassengerGendersFilled, allPassengersAreMale } from '@/lib/bookingPassengerGender'
import styles from '../booking.module.css'

interface AllMaleGenderNoticeProps {
  state: BookingWizardState
  ui: BookingWizardUi
}

/** Tüm cinsiyetler seçildikten sonra, hepsi bay ise form içinde gösterilir. */
export default function AllMaleGenderNotice({ state, ui }: AllMaleGenderNoticeProps) {
  if (!allPassengerGendersFilled(state) || !allPassengersAreMale(state)) return null

  return (
    <div className={styles.genderPolicyNotice} role="alert">
      <span className={styles.genderPolicyNoticeIcon} aria-hidden>
        !
      </span>
      <p className={styles.genderPolicyNoticeText}>{ui.allMaleBlocked}</p>
    </div>
  )
}
