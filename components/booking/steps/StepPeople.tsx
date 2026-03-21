'use client'

import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import styles from '../booking.module.css'

interface StepPeopleProps {
  tour: TourForBooking
  counts: BookingWizardState['counts']
  maxPax: number
  onUpdate: (counts: BookingWizardState['counts']) => void
}

export default function StepPeople({
  tour,
  counts,
  maxPax,
  onUpdate,
}: StepPeopleProps) {
  const total = counts.adult + counts.child + counts.baby
  const canDecrementAdult = counts.adult > 1
  const canIncrement = total < maxPax
  const valid = counts.adult >= 1 && total >= 1 && total <= maxPax

  const rules = tour.bookingRules
  const showRules = rules?.show !== false && (rules?.bullets?.length ?? 0) > 0

  return (
    <>
      {showRules && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {rules?.title ?? 'Rezervasyon Bilgileri'}
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {(rules?.bullets ?? []).map((text, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 14, color: '#52525b' }}>
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardCaption}>
          <span className={styles.cardCaptionIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>Kişi Sayısı</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
        <div className={styles.counterList}>
        <div className={styles.counterRow}>
          <div>
            <div className={styles.counterLabel}>Yetişkin</div>
            <div className={styles.counterSub}>11–99 yaş</div>
          </div>
          <div className={styles.counterControls}>
            <button
              type="button"
              className={styles.counterBtn}
              disabled={!canDecrementAdult}
              onClick={() => onUpdate({ ...counts, adult: Math.max(1, counts.adult - 1) })}
              aria-label="Yetişkin azalt"
            >
              −
            </button>
            <span className={styles.counterValue}>{counts.adult}</span>
            <button
              type="button"
              className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
              disabled={!canIncrement}
              onClick={() => onUpdate({ ...counts, adult: counts.adult + 1 })}
              aria-label="Yetişkin artır"
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.counterRow}>
          <div>
            <div className={styles.counterLabel}>Çocuk</div>
            <div className={styles.counterSub}>6–10 yaş</div>
          </div>
          <div className={styles.counterControls}>
            <button
              type="button"
              className={styles.counterBtn}
              disabled={counts.child <= 0}
              onClick={() => onUpdate({ ...counts, child: Math.max(0, counts.child - 1) })}
              aria-label="Çocuk azalt"
            >
              −
            </button>
            <span className={styles.counterValue}>{counts.child}</span>
            <button
              type="button"
              className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
              disabled={!canIncrement}
              onClick={() => onUpdate({ ...counts, child: counts.child + 1 })}
              aria-label="Çocuk artır"
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.counterRow}>
          <div>
            <div className={styles.counterLabel}>Bebek</div>
            <div className={styles.counterSub}>0–5 yaş</div>
          </div>
          <div className={styles.counterControls}>
            <button
              type="button"
              className={styles.counterBtn}
              disabled={counts.baby <= 0}
              onClick={() => onUpdate({ ...counts, baby: Math.max(0, counts.baby - 1) })}
              aria-label="Bebek azalt"
            >
              −
            </button>
            <span className={styles.counterValue}>{counts.baby}</span>
            <button
              type="button"
              className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
              disabled={!canIncrement}
              onClick={() => onUpdate({ ...counts, baby: counts.baby + 1 })}
              aria-label="Bebek artır"
            >
              +
            </button>
          </div>
        </div>
        </div>

        {total > maxPax && (
          <p className={styles.errorText} style={{ marginTop: 8 }}>
            En fazla {maxPax} kişi seçebilirsiniz.
          </p>
        )}
        </div>
      </div>
    </>
  )
}
