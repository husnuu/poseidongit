'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

export type AdminSessionUser = {
  id: string
  email: string
}

type AdminAuthContextValue = {
  user: AdminSessionUser | null
  initializing: boolean
  isAdmin: boolean
  /** Çerez oturumu: API çağrılarında kullanılmaz; legacy Bearer için null döner. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>
  signOutAll: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

const AGENT_TOKEN_KEY = 'poseidon_agent_token'
const AGENT_EMAIL_KEY = 'poseidon_agent_email'
const LEGACY_ADMIN_TOKEN_KEY = 'poseidon_admin_token'
const LEGACY_ADMIN_EMAIL_KEY = 'poseidon_admin_email'

/** Hareket yoksa oturumu kapat (klavye, tıklama, dokunma, kaydırma, tekerlek). */
const ADMIN_IDLE_LOGOUT_MS = 10 * 60 * 1000

async function fetchAdminStatsOk(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/bookings/stats', { credentials: 'include' })
    return res.ok
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AdminAuth] stats isteği başarısız.', e)
    }
    return false
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AdminSessionUser | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const signOutAll = useCallback(async () => {
    try {
      await fetch('/api/admin/session/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AGENT_TOKEN_KEY)
      window.sessionStorage.removeItem(AGENT_EMAIL_KEY)
      window.sessionStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY)
      window.sessionStorage.removeItem(LEGACY_ADMIN_EMAIL_KEY)
    }
    setUser(null)
    setIsAdmin(false)
  }, [])

  useEffect(() => {
    let mounted = true
    const bootstrap = async () => {
      setInitializing(true)
      try {
        const me = await fetch('/api/admin/session/me', { credentials: 'include' })
        if (!mounted) return
        if (!me.ok) {
          setUser(null)
          setIsAdmin(false)
          setInitializing(false)
          return
        }
        const data = (await me.json()) as { ok?: boolean; user?: { id: string; email: string } }
        const u = data.user
        if (!u?.id || !u.email) {
          setUser(null)
          setIsAdmin(false)
          setInitializing(false)
          return
        }
        setUser({ id: u.id, email: u.email })
        const statsOk = await fetchAdminStatsOk()
        if (!mounted) return
        if (statsOk) {
          setIsAdmin(true)
        } else {
          await signOutAll()
          router.replace('/login?error=forbidden')
        }
      } catch {
        if (!mounted) return
        setUser(null)
        setIsAdmin(false)
      } finally {
        if (mounted) setInitializing(false)
      }
    }
    void bootstrap()
    return () => {
      mounted = false
    }
  }, [router, signOutAll])

  /** JWT 1 saat sonra dolar; açık sekmede kalan kullanıcıyı periyodik /me ile çıkarır (yönlendirme + temizlik). */
  useEffect(() => {
    if (!isAdmin || !user) return

    const verifySession = async () => {
      try {
        const me = await fetch('/api/admin/session/me', { credentials: 'include' })
        if (!me.ok) {
          await signOutAll()
          router.replace('/login?error=session')
        }
      } catch {
        await signOutAll()
        router.replace('/login?error=session')
      }
    }

    const intervalMs = 60_000
    const id = window.setInterval(() => void verifySession(), intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void verifySession()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isAdmin, user, router, signOutAll])

  /** 10 dk boyunca etkileşim yoksa çıkış + giriş sayfası. */
  const idleLogoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  useEffect(() => {
    if (!isAdmin || !user) return

    const clearIdleTimer = () => {
      if (idleLogoutRef.current != null) {
        window.clearTimeout(idleLogoutRef.current)
        idleLogoutRef.current = null
      }
    }

    const armIdleTimer = () => {
      clearIdleTimer()
      idleLogoutRef.current = window.setTimeout(() => {
        idleLogoutRef.current = null
        void (async () => {
          await signOutAll()
          router.replace('/login?reason=idle')
        })()
      }, ADMIN_IDLE_LOGOUT_MS)
    }

    armIdleTimer()

    const bump = () => armIdleTimer()
    const wheelOpts: AddEventListenerOptions = { passive: true }

    window.addEventListener('keydown', bump)
    window.addEventListener('mousedown', bump)
    window.addEventListener('touchstart', bump)
    window.addEventListener('pointerdown', bump)
    window.addEventListener('click', bump)
    window.addEventListener('wheel', bump, wheelOpts)
    document.addEventListener('scroll', bump, true)

    return () => {
      clearIdleTimer()
      window.removeEventListener('keydown', bump)
      window.removeEventListener('mousedown', bump)
      window.removeEventListener('touchstart', bump)
      window.removeEventListener('pointerdown', bump)
      window.removeEventListener('click', bump)
      window.removeEventListener('wheel', bump)
      document.removeEventListener('scroll', bump, true)
    }
  }, [isAdmin, user, router, signOutAll])

  const getIdToken = useCallback(async () => {
    return null
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      initializing,
      isAdmin,
      getIdToken,
      signOutAll,
    }),
    [user, initializing, isAdmin, getIdToken, signOutAll]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth yalnızca AdminAuthProvider içinde kullanılabilir.')
  }
  return ctx
}
