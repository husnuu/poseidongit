'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Anchor,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  MessageCircle,
  Ticket,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAdminAuth } from '@/components/admin/AdminAuthContext'

const AGENT_TOKEN_KEY = 'poseidon_agent_token'
const AGENT_EMAIL_KEY = 'poseidon_agent_email'
const COLLAPSED_STORAGE_KEY = 'poseidon_admin_sidebar_collapsed'

/** Yalnızca gerçekten var olan admin rotaları — Kapasite/Transferler/Müşteriler/
    Raporlar/Ayarlar gibi henüz inşa edilmemiş sayfalar için sahte bağlantı
    eklenmedi. Bu bölümler ileride gerçek sayfalar olarak oluşturulduğunda
    buraya eklenebilir. */
const NAV_ITEMS = [
  { href: '/admin/bookings', label: 'Rezervasyonlar', icon: CalendarCheck },
  { href: '/admin/cikti-listesi', label: 'Çıktı Listesi', icon: ClipboardList },
  { href: '/admin/yacht-inquiries', label: 'Motoryat Mesajları', icon: MessageSquare },
  { href: '/admin/whatsapp', label: 'WhatsApp Bildirimleri', icon: MessageCircle },
  { href: '/biletci', label: 'Biletçi', icon: Ticket },
] as const

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOutAll } = useAdminAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1')
    } catch {
      /* localStorage kapalı olabilir — sorun değil, varsayılan açık kalır */
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* no-op */
      }
      return next
    })
  }

  const handleLogout = async () => {
    await signOutAll()
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AGENT_TOKEN_KEY)
      window.sessionStorage.removeItem(AGENT_EMAIL_KEY)
    }
    router.replace('/login')
  }

  const brand = (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-[#f1f5f9] px-4">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
        style={{ background: 'var(--primary, #2168b8)' }}
      >
        <Anchor className="h-4 w-4" aria-hidden />
      </div>
      {!collapsed && (
        <span className="truncate text-sm font-black tracking-tight text-[#131719]">
          Poseidon Admin
        </span>
      )}
    </div>
  )

  // Mobil overlay her zaman geniş hâlde açılır — masaüstü "daralt" durumunu
  // miras almaması için nav/profile, kendi genişlik durumunu parametre olarak alır.
  const renderNav = (isCollapsed: boolean) => (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/biletci' && pathname?.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            title={isCollapsed ? label : undefined}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm font-bold transition-colors ${
              active ? 'bg-blue-50 text-primary' : 'text-zinc-500 hover:bg-zinc-50 hover:text-[#131719]'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </Link>
        )
      })}
    </nav>
  )

  const renderProfile = (isCollapsed: boolean) => (
    <div className="shrink-0 border-t border-[#f1f5f9] p-2">
      <div className={`flex items-center gap-2.5 rounded-md px-2 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-500">
          {(user?.email ?? '?').slice(0, 1).toUpperCase()}
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#131719]">{user?.email ?? '—'}</p>
            <p className="truncate text-[11px] font-semibold text-zinc-400">Yönetici</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        title={isCollapsed ? 'Çıkış' : undefined}
        className={`mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-bold text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
        {!isCollapsed && <span>Çıkış</span>}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobil üst çubuk: sabit sidebar yerine açılır menü */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#f1f5f9] bg-white px-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
            style={{ background: 'var(--primary, #2168b8)' }}
          >
            <Anchor className="h-4 w-4" aria-hidden />
          </div>
          <span className="text-sm font-black tracking-tight text-[#131719]">Poseidon Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Menüyü aç"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[#f1f5f9] bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Masaüstü: kalıcı, kapatılabilir sol sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#f1f5f9] bg-white transition-[width] duration-150 md:flex ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {brand}
        {renderNav(collapsed)}
        {renderProfile(collapsed)}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Sidebar’ı genişlet' : 'Sidebar’ı daralt'}
          className="flex h-10 shrink-0 items-center justify-center gap-2 border-t border-[#f1f5f9] text-xs font-bold text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
          {!collapsed && <span>Daralt</span>}
        </button>
      </aside>

      {/* Mobil: tam ekran overlay + açılır sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-[#131719]/50" aria-hidden onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#f1f5f9] px-4">
              <span className="text-sm font-black tracking-tight text-[#131719]">Poseidon Admin</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Menüyü kapat"
                className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {renderNav(false)}
            {renderProfile(false)}
          </aside>
        </div>
      )}
    </>
  )
}
