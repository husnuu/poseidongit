'use client'

import { BedDouble, Check, Lock } from 'lucide-react'
import type { FirstClassLocaUi } from '@/lib/i18n/bookingWizardUi'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from './FirstClassSeatSelector.module.css'

const LOCAS: { id: string; row: number }[] = [
  { id: 'L1', row: 1 },
  { id: 'L2', row: 1 },
  { id: 'L3', row: 1 },
  { id: 'L4', row: 1 },
  { id: 'L5', row: 1 },
  { id: 'L6', row: 2 },
  { id: 'L7', row: 2 },
  { id: 'L8', row: 2 },
  { id: 'L9', row: 2 },
  { id: 'L10', row: 2 },
]

const LOCA_REGEX = /^L(10|[1-9])$/

export interface FirstClassSeatSelectorProps {
  selectedLocaIds: string[]
  reservedLocaIds: string[]
  currentBookingLocaIds?: string[]
  requiredCount: number
  onToggle: (locaId: string) => void
  onReplace?: (removeId: string, addId: string) => void
  locaUi?: FirstClassLocaUi
}

export default function FirstClassSeatSelector({
  selectedLocaIds,
  reservedLocaIds,
  currentBookingLocaIds = [],
  requiredCount,
  onToggle,
  onReplace,
  locaUi: locaUiProp,
}: FirstClassSeatSelectorProps) {
  const locaUi = locaUiProp ?? getBookingWizardUi('tr').firstClassLoca
  const reservedSet = new Set(reservedLocaIds.map((id) => id.trim().toUpperCase()))
  const mineSet = new Set(
    currentBookingLocaIds
      .filter((id) => LOCA_REGEX.test(id.trim().toUpperCase()))
      .map((id) => id.trim().toUpperCase())
  )
  const selectedSet = new Set(
    selectedLocaIds
      .filter((id) => LOCA_REGEX.test(id.trim().toUpperCase()))
      .map((id) => id.trim().toUpperCase())
  )
  const row1 = LOCAS.filter((l) => l.row === 1)
  const row2 = LOCAS.filter((l) => l.row === 2)

  const renderLocaCard = (loca: (typeof LOCAS)[0]) => {
    const isReserved = reservedSet.has(loca.id)
    const isMine = mineSet.has(loca.id)
    const isSelected = selectedSet.has(loca.id)
    const available = !isReserved
    const atLimit = selectedSet.size >= requiredCount && requiredCount > 0
    const firstSelectedId = selectedLocaIds.find((id) => selectedSet.has(id.trim().toUpperCase()))

    const handleClick = () => {
      if (!available) return
      if (isSelected) {
        onToggle(loca.id)
        return
      }
      if (atLimit && onReplace && firstSelectedId) {
        onReplace(firstSelectedId.trim().toUpperCase(), loca.id)
        return
      }
      if (selectedSet.size < requiredCount) onToggle(loca.id)
    }

    const btnClass = [
      styles.locaBtn,
      isReserved
        ? styles.locaBtnReserved
        : isSelected
          ? styles.locaBtnSelected
          : isMine
            ? styles.locaBtnMine
            : styles.locaBtnAvailable,
    ].join(' ')

    return (
      <button
        key={loca.id}
        type="button"
        disabled={!available}
        onClick={handleClick}
        aria-pressed={isSelected}
        aria-disabled={!available}
        aria-label={`${loca.id} ${isReserved ? locaUi.taken : isSelected ? locaUi.selected : isMine ? locaUi.yourBooth : locaUi.available}`}
        className={btnClass}
      >
        {isReserved ? (
          <Lock className={styles.iconSm} aria-hidden />
        ) : (
          <BedDouble className={styles.iconMd} aria-hidden />
        )}
        <span className={styles.locaId}>{loca.id}</span>
        <span className={styles.locaSub}>
          {isReserved ? locaUi.taken : isMine && !isSelected ? locaUi.yourBooth : locaUi.twoPerson}
        </span>
        {!isReserved &&
          (isSelected ? (
            <span className={styles.checkWrap} aria-label={locaUi.selectedIconAria}>
              <Check className={styles.checkIcon} strokeWidth={2.5} aria-hidden />
            </span>
          ) : isMine ? (
            <span className={`${styles.badge} ${styles.badgeCurrent}`}>{locaUi.current}</span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeOpen}`}>{locaUi.availableBadge}</span>
          ))}
      </button>
    )
  }

  const selectedCount = selectedSet.size
  const complete = requiredCount > 0 && selectedCount === requiredCount

  return (
    <div className={styles.wrap} role="group" aria-label={locaUi.ariaGroup}>
      <div className={styles.stage}>
        <span className={styles.rowLabel}>{locaUi.bowRowLabel}</span>
        <div className={styles.grid}>{row1.map(renderLocaCard)}</div>
        <div className={`${styles.grid} ${styles.row2}`}>{row2.map(renderLocaCard)}</div>
        <div
          className={`${styles.footer} ${complete ? styles.footerComplete : ''}`}
          aria-live="polite"
        >
          {locaUi.selectedOfRequired(selectedCount, requiredCount)}
        </div>
      </div>
    </div>
  )
}
