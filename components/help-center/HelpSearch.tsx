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
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
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
          className="w-full rounded border border-white/25 bg-white py-3 pl-10 pr-3 text-base text-zinc-900 shadow-lg shadow-black/15 outline-none ring-0 placeholder:text-zinc-400 focus:border-white/50 focus:ring-2 focus:ring-white/50 sm:py-3.5 sm:pl-11 sm:text-[17px]"
          style={{ fontFamily: 'var(--font-family), sans-serif' }}
        />
      </div>
      {showCount && value.trim() && typeof resultCount === 'number' ? (
        <p
          className="mt-2 text-sm text-white/80"
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
