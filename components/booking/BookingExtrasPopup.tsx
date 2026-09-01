'use client'

import { Check } from 'lucide-react'
import type { ExtraForBooking, SelectedBookingExtraState } from '@/lib/sanity/bookingTypes'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import {
  extraIdentity,
  extraLineTotal,
  isHotelTransferExtra,
  payingPaxForExtras,
} from '@/lib/bookingExtras'
import styles from './booking.module.css'

type Counts = { adult: number; child: number; baby: number }

interface BookingExtrasPopupProps {
  extras: ExtraForBooking[]
  selected: SelectedBookingExtraState[]
  counts: Counts
  ui: BookingWizardUi
  error: string | null
  onChange: (next: SelectedBookingExtraState[]) => void
  onSkip: () => void
  onConfirm: () => void
  onClose: () => void
}

export default function BookingExtrasPopup({
  extras,
  selected,
  counts,
  ui,
  error,
  onChange,
  onSkip,
  onConfirm,
  onClose,
}: BookingExtrasPopupProps) {
  const payingPax = payingPaxForExtras({ adult: counts.adult, child: counts.child })

  const selectedMap = new Map(selected.map((s) => [s.key, s]))

  const toggle = (extra: ExtraForBooking, index: number) => {
    const key = extraIdentity(extra, index)
    if (selectedMap.has(key)) {
      onChange(selected.filter((s) => s.key !== key))
      return
    }
    onChange([
      ...selected,
      {
        key,
        hotelName: '',
        transferFromHotel: false,
      },
    ])
  }

  const patch = (key: string, next: Partial<SelectedBookingExtraState>) => {
    onChange(selected.map((s) => (s.key === key ? { ...s, ...next } : s)))
  }

  return (
    <div className={styles.extrasPopupBackdrop} role="presentation">
      <div
        className={styles.extrasPopup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-extras-title"
      >
        <div className={styles.extrasPopupHead}>
          <div>
            <h2 id="booking-extras-title" className={styles.extrasPopupTitle}>
              {ui.extrasPopupTitle}
            </h2>
            <p className={styles.extrasPopupSub}>{ui.extrasPopupSubtitle}</p>
          </div>
          <button type="button" className={styles.extrasPopupClose} onClick={onClose} aria-label={ui.closeAria}>
            ×
          </button>
        </div>

        <div className={styles.extrasPopupList}>
          {extras.map((extra, index) => {
            const key = extraIdentity(extra, index)
            const sel = selectedMap.get(key)
            const active = Boolean(sel)
            const line = extraLineTotal(extra, payingPax)
            const unitLabel =
              extra.priceType === 'total' ? ui.extrasFlat : `${ui.extrasPerPerson}`
            const imgUrl = extra.image?.url
            const hotel = isHotelTransferExtra(extra)
            return (
              <article
                key={key}
                className={`${styles.extrasCard} ${active ? styles.extrasCardActive : ''}`}
              >
                <button
                  type="button"
                  className={styles.extrasCardMain}
                  onClick={() => toggle(extra, index)}
                  aria-pressed={active}
                >
                  <div className={styles.extrasCardThumb}>
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={extra.image?.alt || extra.title} />
                    ) : extra.icon ? (
                      <span className={styles.extrasCardIcon}>{extra.icon}</span>
                    ) : (
                      <span className={styles.extrasCardIconFallback} aria-hidden>
                        +
                      </span>
                    )}
                  </div>
                  <div className={styles.extrasCardBody}>
                    <div className={styles.extrasCardTitleRow}>
                      <h3>{extra.title}</h3>
                      {active && (
                        <span className={styles.extrasCardBadge}>
                          <Check width={12} height={12} aria-hidden />
                          {ui.extrasSelected}
                        </span>
                      )}
                    </div>
                    {extra.description ? <p className={styles.extrasCardDesc}>{extra.description}</p> : null}
                    <p className={styles.extrasCardPrice}>
                      {line.toLocaleString(ui.numberLocale)} ₺
                      <span>
                        {' '}
                        · {Number(extra.price).toLocaleString(ui.numberLocale)} ₺ {unitLabel}
                      </span>
                    </p>
                  </div>
                </button>

                {active && hotel && sel && (
                  <div className={styles.extrasHotelBox}>
                    <label className={styles.extrasHotelLabel} htmlFor={`hotel-name-${key}`}>
                      {extra.hotelNameLabel?.trim() || ui.extrasHotelFallbackLabel}
                    </label>
                    <input
                      id={`hotel-name-${key}`}
                      className={styles.extrasHotelInput}
                      type="text"
                      value={sel.hotelName ?? ''}
                      placeholder={extra.hotelNamePlaceholder?.trim() || ''}
                      onChange={(e) => patch(key, { hotelName: e.target.value })}
                      autoComplete="organization"
                    />
                    {extra.hotelNameHelp ? (
                      <p className={styles.extrasHotelHelp}>{extra.hotelNameHelp}</p>
                    ) : null}
                    <label className={styles.extrasTransferCheck}>
                      <input
                        type="checkbox"
                        checked={sel.transferFromHotel === true}
                        onChange={(e) => patch(key, { transferFromHotel: e.target.checked })}
                      />
                      <span>
                        <strong>
                          {extra.transferFromHotelLabel?.trim() || ui.extrasTransferFallbackLabel}
                        </strong>
                        {extra.transferFromHotelDescription ? (
                          <em>{extra.transferFromHotelDescription}</em>
                        ) : null}
                      </span>
                    </label>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {error ? (
          <p className={styles.extrasPopupError} role="alert">
            {error}
          </p>
        ) : (
          <p className={styles.extrasPopupHint}>{ui.extrasNoneHint}</p>
        )}

        <div className={styles.extrasPopupActions}>
          <button type="button" className={styles.extrasSkipBtn} onClick={onSkip}>
            {ui.extrasSkip}
          </button>
          <button type="button" className={styles.extrasContinueBtn} onClick={onConfirm}>
            {selected.length > 0 ? ui.extrasContinue : ui.continue}
          </button>
        </div>
      </div>
    </div>
  )
}
