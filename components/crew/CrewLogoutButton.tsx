'use client'

import { useRouter } from 'next/navigation'

export default function CrewLogoutButton({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/crew/logout', { method: 'POST' })
    router.replace('/ekip/giris')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Çıkış yap"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
    >
      {children}
    </button>
  )
}
