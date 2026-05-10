'use client'

import { Search } from 'lucide-react'

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  labelSrOnly: string
  countNone: string
  countListed: (n: number) => string
  resultCount?: number | null
  showCount?: boolean
}

export default function HelpSearch({
  id,
  value,
  onChange,
  placeholder,
  labelSrOnly,
  countNone,
  countListed,
  resultCount,
  showCount,
}: Props) {
  return (
    <div className="w-full max-w-2xl">
      <label htmlFor={id} className="sr-only">
        {labelSrOnly}
      </label>
      <div className="relative rounded-2xl bg-white/[0.97] p-1 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/50 backdrop-blur-md">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-[#1e3a8a]/55"
          aria-hidden
          strokeWidth={2}
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-[14px] border-0 bg-transparent py-3.5 pl-12 pr-4 text-[15px] text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:ring-2 focus:ring-[#1e3a8a]/25 sm:py-4 sm:pl-[3.25rem] sm:text-[17px]"
          style={{ fontFamily: 'var(--font-family), sans-serif' }}
        />
      </div>
      {showCount && value.trim() && typeof resultCount === 'number' ? (
        <p
          className="mt-3 text-[13px] font-medium text-white/85 sm:text-sm"
          style={{ fontFamily: 'var(--font-family), sans-serif' }}
          role="status"
          aria-live="polite"
        >
          {resultCount === 0 ? countNone : countListed(resultCount)}
        </p>
      ) : null}
    </div>
  )
}
