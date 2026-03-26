'use client'

import type { YachtRentalMode } from '@/lib/yachtRentalModes'

interface YachtRentalModeTabsProps {
  value: YachtRentalMode
  onChange: (mode: YachtRentalMode) => void
}

export default function YachtRentalModeTabs({ value, onChange }: YachtRentalModeTabsProps) {
  return (
    <div
      className="flex rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-1 gap-1 mb-4"
      role="tablist"
      aria-label="Kiralama türü"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'daily'}
        className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-extrabold uppercase tracking-wide transition ${
          value === 'daily'
            ? 'bg-white text-[#1e3a5f] shadow-sm ring-1 ring-zinc-200/80'
            : 'text-zinc-500 hover:text-zinc-800'
        }`}
        style={{ fontFamily: 'var(--font-family)' }}
        onClick={() => onChange('daily')}
      >
        Günlük
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'overnight'}
        className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-extrabold uppercase tracking-wide transition ${
          value === 'overnight'
            ? 'bg-white text-[#1e3a5f] shadow-sm ring-1 ring-zinc-200/80'
            : 'text-zinc-500 hover:text-zinc-800'
        }`}
        style={{ fontFamily: 'var(--font-family)' }}
        onClick={() => onChange('overnight')}
      >
        Konaklamalı
      </button>
    </div>
  )
}
