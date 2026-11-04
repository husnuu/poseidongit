'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

const TABS = [
  { href: '/partner', label: 'Özet' },
  { href: '/partner/yeni', label: 'Yeni rezervasyon' },
  { href: '/partner/paylas', label: 'QR ve bağlantı' },
  { href: '/partner/ayarlar', label: 'Ayarlar' },
]

export default function PartnerNav({ name }: { name: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/partner/logout', { method: 'POST' }).catch(() => undefined)
    router.replace('/partner/giris')
    router.refresh()
  }

  return (
    <header className="border-b border-zinc-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#131719]">{name}</p>
          <p className="text-[11px] font-semibold text-zinc-400">Poseidon Partner</p>
        </div>
        <button type="button" onClick={logout} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4" aria-hidden />
          Çıkış
        </button>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-bold ${
                active ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-[#131719]'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
