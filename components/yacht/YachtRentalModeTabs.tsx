'use client'

import { Moon, Sun } from 'lucide-react'
import type { YachtRentalMode } from '@/lib/yachtRentalModes'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'

interface YachtRentalModeTabsProps {
  value: YachtRentalMode
  onChange: (mode: YachtRentalMode) => void
  locale?: SiteLocale
}

/**
 * Günlük / Konaklamalı seçici. Segment kontrol: açık gri kapsayıcının içinde
 * seçili tarafa kayan beyaz gösterge; her seçenekte ikon (güneş / ay), aktif
 * taraf marka mavisi ve kalın. Gösterge transform ile kaydığı için yerleşim
 * kaymıyor.
 */
export default function YachtRentalModeTabs({ value, onChange, locale = 'tr' }: YachtRentalModeTabsProps) {
  const ui = getYachtUi(locale)
  const options: { mode: YachtRentalMode; label: string; Icon: typeof Sun }[] = [
    { mode: 'daily', label: ui.rentalModeDaily, Icon: Sun },
    { mode: 'overnight', label: ui.rentalModeOvernight, Icon: Moon },
  ]
  const activeIndex = value === 'overnight' ? 1 : 0

  return (
    <div
      className="relative mb-6 grid grid-cols-2 rounded-2xl bg-[#eef2f6] p-1.5"
      role="tablist"
      aria-label={ui.rentalModeTabsAria}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 rounded-xl bg-white shadow-[0_2px_10px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: 'calc(50% - 6px)', transform: `translateX(${activeIndex * 100}%)` }}
      />
      {options.map(({ mode, label, Icon }) => {
        const active = value === mode
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode)}
            className={`relative z-10 flex h-12 items-center justify-center gap-2 rounded-xl text-[14px] uppercase tracking-wide transition-colors duration-200 ${
              active ? 'font-extrabold text-[var(--primary,#2168b8)]' : 'font-bold text-[#64748b] hover:text-[var(--secondary,#131719)]'
            }`}
            style={{ fontFamily: 'var(--font-family)' }}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
