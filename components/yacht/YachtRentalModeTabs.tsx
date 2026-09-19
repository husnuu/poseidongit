'use client'

import type { YachtRentalMode } from '@/lib/yachtRentalModes'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'

interface YachtRentalModeTabsProps {
  value: YachtRentalMode
  onChange: (mode: YachtRentalMode) => void
  locale?: SiteLocale
}

export default function YachtRentalModeTabs({ value, onChange, locale = 'tr' }: YachtRentalModeTabsProps) {
  const ui = getYachtUi(locale)
  return (
    <div
      className="flex rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-1 gap-1 mb-4"
      role="tablist"
      aria-label={ui.rentalModeTabsAria}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'daily'}
        className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-extrabold uppercase tracking-wide transition ${
          value === 'daily'
            ? 'bg-white text-[#2168b8] shadow-sm ring-1 ring-zinc-200/80'
            : 'text-zinc-500 hover:text-zinc-800'
        }`}
        style={{ fontFamily: 'var(--font-family)' }}
        onClick={() => onChange('daily')}
      >
        {ui.rentalModeDaily}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'overnight'}
        className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-extrabold uppercase tracking-wide transition ${
          value === 'overnight'
            ? 'bg-white text-[#2168b8] shadow-sm ring-1 ring-zinc-200/80'
            : 'text-zinc-500 hover:text-zinc-800'
        }`}
        style={{ fontFamily: 'var(--font-family)' }}
        onClick={() => onChange('overnight')}
      >
        {ui.rentalModeOvernight}
      </button>
    </div>
  )
}
