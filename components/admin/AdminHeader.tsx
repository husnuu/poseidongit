'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/components/admin/AdminAuthContext'

const AGENT_TOKEN_KEY = 'poseidon_agent_token'
const AGENT_EMAIL_KEY = 'poseidon_agent_email'

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOutAll } = useAdminAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const bookingsActive = pathname === '/admin/bookings'
  const yachtInquiriesActive = pathname === '/admin/yacht-inquiries'

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleLogout = async () => {
    await signOutAll()
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AGENT_TOKEN_KEY)
      window.sessionStorage.removeItem(AGENT_EMAIL_KEY)
    }
    router.replace('/login')
  }

  const navLinks = (
    <>
      <Link
        href="/admin/bookings"
        className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
          bookingsActive
            ? 'bg-teal-100 text-teal-800'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
        onClick={() => setMenuOpen(false)}
      >
        Rezervasyonlar
      </Link>
      <Link
        href="/admin/yacht-inquiries"
        className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
          yachtInquiriesActive
            ? 'bg-cyan-100 text-cyan-800'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
        onClick={() => setMenuOpen(false)}
      >
        Motoryat Mesajları
      </Link>
      <Link
        href="/biletci"
        className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        onClick={() => setMenuOpen(false)}
      >
        Biletçi
      </Link>
    </>
  )

  return (
    <header className="relative border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 min-h-[3.5rem] max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
        <Link
          href="/admin/bookings"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-90 sm:gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white sm:h-9 sm:w-9">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="block truncate text-base font-bold tracking-tight text-slate-800 sm:text-lg">{process.env.NEXT_PUBLIC_SITE_NAME || 'Admin'}</span>
            <span className="hidden truncate text-xs font-medium text-slate-500 sm:block sm:text-sm">Rezervasyon Paneli</span>
          </div>
        </Link>

        {/* Desktop: nav + logout */}
        <div className="hidden items-center gap-2 md:flex md:gap-4">
          <nav className="flex items-center gap-1">
            {navLinks}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Çıkış
          </button>
        </div>

        {/* Mobile: hamburger + dropdown */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white shadow-lg md:hidden">
            <nav className="flex flex-col gap-0.5 p-3">
              {navLinks}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Çıkış
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
