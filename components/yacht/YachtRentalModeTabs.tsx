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
  // Feribot rezervasyon sihirbazındaki "Tek Yön / Aynı Gün / Farklı Gün"
  // sekmeleriyle birebir aynı tasarım: gri hap kapsayıcı, aktif sekme beyaz
  // zemin + SİYAH (mavi değil) kalın yazı.
  return (
    <div
      className="mb-4 flex flex-wrap gap-0.5 rounded-xl border border-[#e2e8f0] p-1"
      style={{ background: '#eef2f6' }}
      role="tablist"
      aria-label={ui.rentalModeTabsAria}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'daily'}
        className="flex-1 rounded-[9px] px-2.5 py-2.5 text-center text-[12.5px] font-semibold leading-tight transition"
        style={
          value === 'daily'
            ? { background: '#fff', color: 'var(--secondary, #131719)', fontWeight: 700, boxShadow: '0 1px 4px rgba(15, 23, 42, 0.1)' }
            : { background: 'transparent', color: '#64748b' }
        }
        onClick={() => onChange('daily')}
      >
        {ui.rentalModeDaily}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'overnight'}
        className="flex-1 rounded-[9px] px-2.5 py-2.5 text-center text-[12.5px] font-semibold leading-tight transition"
        style={
          value === 'overnight'
            ? { background: '#fff', color: 'var(--secondary, #131719)', fontWeight: 700, boxShadow: '0 1px 4px rgba(15, 23, 42, 0.1)' }
            : { background: 'transparent', color: '#64748b' }
        }
        onClick={() => onChange('overnight')}
      >
        {ui.rentalModeOvernight}
      </button>
    </div>
  )
}
