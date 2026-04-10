'use client'

import { BedDouble, Check, Lock, ChevronRight } from 'lucide-react'
import type { FirstClassLocaUi } from '@/lib/i18n/bookingWizardUi'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'

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
  /** Seçili loca id'leri (çoklu seçim). */
  selectedLocaIds: string[]
  /** Bu tarih için başka rezervasyonlarda kullanılan loca id'leri. */
  reservedLocaIds: string[]
  /**
   * Rezervasyonumu yönet: mevcut rezervasyondaki loca’lar (API’de exclude edildiği için reserved’da yok).
   * Görünürde “Sizin loca” olarak işaretlenir.
   */
  currentBookingLocaIds?: string[]
  /** Kaç loca seçilmesi gerekiyor (kişi sayısı / 2). */
  requiredCount: number
  /** Loca tıklandığında: seçiliyse çıkar, değilse ekle veya (kotada doluysa) bir seçimin yerine geç. */
  onToggle: (locaId: string) => void
  /** Kotada yer doluysa başka bir locaya tıklanınca: eski seçimin yerine yeniyi koy (opsiyonel). */
  onReplace?: (removeId: string, addId: string) => void
  /** Tüm localar seçildikten sonra "Devam" ile çağrılır. */
  onAfterSelect?: () => void
  /** Yerelleştirilmiş etiketler (yoksa Türkçe). */
  locaUi?: FirstClassLocaUi
}

export default function FirstClassSeatSelector({
  selectedLocaIds,
  reservedLocaIds,
  currentBookingLocaIds = [],
  requiredCount,
  onToggle,
  onReplace,
  onAfterSelect,
  locaUi: locaUiProp,
}: FirstClassSeatSelectorProps) {
  const locaUi = locaUiProp ?? getBookingWizardUi('tr').firstClassLoca
  const reservedSet = new Set(reservedLocaIds.map((id) => id.trim().toUpperCase()))
  const mineSet = new Set(
    currentBookingLocaIds.filter((id) => LOCA_REGEX.test(id.trim().toUpperCase())).map((id) => id.trim().toUpperCase())
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

    return (
      <button
        key={loca.id}
        type="button"
        disabled={!available}
        onClick={handleClick}
        aria-pressed={isSelected}
        aria-disabled={!available}
        aria-label={`${loca.id} ${isReserved ? locaUi.taken : isSelected ? locaUi.selected : isMine ? locaUi.yourBooth : locaUi.available}`}
        className={`
          relative flex h-[100px] min-h-[100px] w-full min-w-0 sm:min-w-[88px] flex-col items-center justify-center gap-0 rounded-2xl border-2 py-2
          text-center shadow-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400/60
          ${available ? 'cursor-pointer' : 'cursor-not-allowed'}
          ${isReserved
            ? 'border-zinc-200 bg-zinc-200/70 text-zinc-500 opacity-60 shadow-none'
            : isSelected
              ? 'border-[#1e3a5f] bg-sky-50/90 text-[#1e3a5f] shadow-md ring-2 ring-sky-200/80 ring-offset-2'
              : isMine
                ? 'border-amber-300/90 bg-amber-50/90 text-amber-950 hover:border-amber-400 hover:bg-amber-50'
                : 'border-stone-200/90 bg-[#fdfcfb] text-stone-700 hover:border-sky-300 hover:bg-sky-50/50 hover:shadow'}
        `}
      >
        {isReserved ? (
          <Lock className="mb-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" aria-hidden />
        ) : (
          <BedDouble className="mb-0.5 h-4 w-4 flex-shrink-0 text-current opacity-80" aria-hidden />
        )}
        <span className="text-sm font-semibold leading-tight">{loca.id}</span>
        <span className="text-[10px] leading-tight text-stone-500">
          {isReserved ? locaUi.taken : isMine && !isSelected ? locaUi.yourBooth : locaUi.twoPerson}
        </span>
        {!isReserved && (
          isSelected ? (
            <span className="mt-1 flex items-center justify-center rounded-full bg-[#1e3a5f]/12 p-1" aria-label={locaUi.selectedIconAria}>
              <Check className="h-6 w-6 flex-shrink-0 text-[#1e3a5f]" strokeWidth={2.5} />
            </span>
          ) : isMine ? (
            <span className="mt-1 inline-flex items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-amber-900">
              {locaUi.current}
            </span>
          ) : (
            <span className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium leading-tight text-emerald-700">
              {locaUi.availableBadge}
            </span>
          )
        )}
      </button>
    )
  }

  const selectedCount = selectedSet.size
  const canProceed = requiredCount > 0 && selectedCount === requiredCount

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-stone-200/80 p-1" role="group" aria-label={locaUi.ariaGroup}>
      <div className="relative w-full max-w-full overflow-hidden rounded-xl bg-gradient-to-b from-zinc-100/90 to-zinc-50/50 p-4 shadow-inner">
        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            {locaUi.bowRowLabel}
          </span>
        </div>
        <div className="grid min-w-0 grid-cols-5 gap-2 sm:gap-3">
          {row1.map(renderLocaCard)}
        </div>
        <div className="mt-1.5 grid min-w-0 grid-cols-5 gap-2 sm:gap-3">
          {row2.map(renderLocaCard)}
        </div>
        <div className="mt-3 border-t border-stone-200/80 pt-3 text-center text-sm text-stone-600">
          <span className="font-medium text-stone-700">{locaUi.selectedOfRequired(selectedCount, requiredCount)}</span>
        </div>
      </div>

      {canProceed && onAfterSelect && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onAfterSelect}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#162d47] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
            aria-label={locaUi.confirmContinueAria}
          >
            {locaUi.continue}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
