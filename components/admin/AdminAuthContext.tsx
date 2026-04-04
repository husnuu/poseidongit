'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
