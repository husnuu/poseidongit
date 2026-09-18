'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ScanLine, Wine } from 'lucide-react'

const TABS = [
  { href: '/ekip', label: 'Home', Icon: Home, match: (p: string) => p === '/ekip' },
  { href: '/ekip/scan', label: 'Scan', Icon: ScanLine, match: (p: string) => p.startsWith('/ekip/scan') },
  { href: '/ekip/bar', label: 'Bar', Icon: Wine, match: (p: string) => p.startsWith('/ekip/bar') },
]

export default function CrewBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f1f5f9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold"
              style={{ color: active ? 'var(--primary, #2168b8)' : '#a1a1aa' }}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
