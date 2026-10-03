'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { Check, X, Sparkles, Minus, Plus } from 'lucide-react'
import type { BookingWizardState, ExtraForBooking } from '@/lib/sanity/bookingTypes'
import { resolveExtraNoteConfig } from '@/lib/sanity/bookingPricing'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from './booking.module.css'

interface ExtrasModalProps {
  open: boolean
  onClose: () => void
  onSkip: () => void
  onContinue: () => void
  extras: ExtraForBooking[]
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  ui: BookingWizardUi
}

export default function ExtrasModal({
  open,
  onClose,
  onSkip,
  onContinue,
  extras,
  state,
  onUpdate,
  ui,
}: ExtrasModalProps) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const selectedExtraKeys = state.selectedExtraKeys ?? []
  const extraNotes = state.extraNotes ?? {}
  const extraQuantities = state.extraQuantities ?? {}
  const totalPax = state.counts.adult + state.counts.child + state.counts.baby

  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'extras-modal-portal'
    document.body.appendChild(el)
    setPortalEl(el)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!portalEl) return null

  const handleToggle = (key: string) => {
    const isSelected = selectedExtraKeys.includes(key)
    const next = isSelected
      ? selectedExtraKeys.filter((k) => k !== key)
      : [...selectedExtraKeys, key]
    if (isSelected) {
      const { [key]: _removed, ...restQuantities } = extraQuantities
      onUpdate({ selectedExtraKeys: next, extraQuantities: restQuantities })
    } else {
      // Varsayılan: tüm misafirler için (kişi başı ekstralarda kullanıcı sonra azaltabilir).
      onUpdate({ selectedExtraKeys: next, extraQuantities: { ...extraQuantities, [key]: totalPax } })
    }
  }

  const handleQuantityChange = (key: string, quantity: number) => {
    const clamped = Math.min(totalPax, Math.max(1, quantity))
    onUpdate({ extraQuantities: { ...extraQuantities, [key]: clamped } })
  }

  const handleNoteChange = (key: string, value: string) => {
    onUpdate({ extraNotes: { ...extraNotes, [key]: value } })
  }

  const handleSkip = () => {
    onUpdate({ selectedExtraKeys: [], extraNotes: {}, extraQuantities: {} })
    onSkip()
  }

  const hasMissingNote = selectedExtraKeys.some((key) => {
    const extra = extras.find((e) => e.key === key)
    if (!extra) return false
    const { requiresNote } = resolveExtraNoteConfig(extra)
    return requiresNote && !extraNotes[key]?.trim()
  })

  return createPortal(
    <div
      className={`${styles.extrasOverlay} ${open ? styles.extrasOverlayVisible : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="extras-modal-title"
    >
      <div className={styles.extrasSheet}>
        <div className={styles.extrasSheetHandle} aria-hidden />
        <div className={styles.extrasSheetHeader}>
          <span className={styles.extrasSheetHeaderLeft}>
            <Sparkles width={18} height={18} aria-hidden />
            <h2 id="extras-modal-title" className={styles.extrasSheetTitle}>
              {ui.extrasTitle}
            </h2>
          </span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={ui.modalCloseAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.extrasSheetBody}>
          <div className={styles.extrasList}>
            {extras.map((extra) => {
              const selected = selectedExtraKeys.includes(extra.key)
              const priceSuffix =
                extra.priceType === 'perPerson' ? ui.extraPerPersonSuffix : ui.extraTotalSuffix
              const { requiresNote, noteLabel } = resolveExtraNoteConfig(extra)
              return (
                <div
                  key={extra.key}
                  className={`${styles.extraCard} ${selected ? styles.extraRowSelected : ''}`}
                >
                  <button
                    type="button"
                    className={styles.extraRow}
                    onClick={() => handleToggle(extra.key)}
                    aria-pressed={selected}
                  >
                    <span className={styles.extraThumb} aria-hidden>
                      {extra.image?.url ? (
                        <Image
                          src={extra.image.url}
                          alt=""
                          width={56}
                          height={56}
                          className={styles.extraThumbImg}
                        />
                      ) : (
                        <span className={styles.extraIcon}>{extra.icon || '✨'}</span>
                      )}
                    </span>
                    <span className={styles.extraBody}>
                      <span className={styles.extraTitle}>{extra.title}</span>
                      {extra.description && (
                        <span className={styles.extraDesc}>{extra.description}</span>
                      )}
                    </span>
                    <span className={styles.extraPriceCol}>
                      <span className={styles.extraPrice}>
                        {extra.price.toLocaleString(ui.numberLocale)} ₺
                      </span>
                      <span className={styles.extraPriceSuffix}>{priceSuffix}</span>
                    </span>
                    <span
                      className={`${styles.extraCheckbox} ${selected ? styles.extraCheckboxChecked : ''}`}
                      aria-hidden
                    >
                      {selected && <Check width={14} height={14} strokeWidth={3} />}
                    </span>
                  </button>

                  {selected && extra.priceType === 'perPerson' && totalPax > 1 && (() => {
                    const qty = Math.min(totalPax, Math.max(1, extraQuantities[extra.key] ?? totalPax))
                    return (
                      <div className={styles.extraNoteWrap}>
                        <label className={styles.extraNoteLabel}>{ui.extraQuantityLabel}</label>
                        <div className={styles.extraQuantityRow}>
                          <div className={styles.counterControls}>
                            <button
                              type="button"
                              className={styles.counterBtn}
                              onClick={() => handleQuantityChange(extra.key, qty - 1)}
                              disabled={qty <= 1}
                              aria-label={ui.decreaseAria}
                            >
                              <Minus width={14} height={14} strokeWidth={3} />
                            </button>
                            <span className={styles.counterValue}>{qty}</span>
                            <button
                              type="button"
                              className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
                              onClick={() => handleQuantityChange(extra.key, qty + 1)}
                              disabled={qty >= totalPax}
                              aria-label={ui.increaseAria}
                            >
                              <Plus width={14} height={14} strokeWidth={3} />
                            </button>
                          </div>
                          <span className={styles.extraQuantityTotal}>
                            {(extra.price * qty).toLocaleString(ui.numberLocale)} ₺
                          </span>
                        </div>
                      </div>
                    )
                  })()}

                  {selected && requiresNote && (
                    <div className={styles.extraNoteWrap}>
                      <label className={styles.extraNoteLabel}>
                        {noteLabel || ui.extraNoteDefaultLabel}
                      </label>
                      <input
                        type="text"
                        className={styles.extraNoteInput}
                        placeholder={noteLabel || ui.extraNoteDefaultLabel}
                        value={extraNotes[extra.key] ?? ''}
                        onChange={(e) => handleNoteChange(extra.key, e.target.value)}
                        maxLength={200}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.extrasSheetFooter}>
          <button type="button" className={styles.extrasSkipBtn} onClick={handleSkip}>
            {ui.extrasSkipButton}
          </button>
          <button
            type="button"
            className={styles.stepBtnPrimary}
            onClick={onContinue}
            disabled={hasMissingNote}
          >
            {ui.continue}
          </button>
        </div>
      </div>
    </div>,
    portalEl
  )
}
