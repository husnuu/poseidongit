'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type WishlistItem = {
  id: string
  type: 'tour' | 'yacht'
  title: string
  imageUrl?: string | null
  priceLabel?: string | null
  href: string
}

type WishlistContextValue = {
  items: WishlistItem[]
  isSaved: (id: string) => boolean
  toggle: (item: WishlistItem) => void
  remove: (id: string) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

const STORAGE_KEY = 'poseidon_wishlist_v1'

function readStoredItems(): WishlistItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(readStoredItems())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* localStorage kullanılamıyorsa (gizli sekme vb.) sessizce yok say */
    }
  }, [items, hydrated])

  const isSaved = useCallback((id: string) => items.some((i) => i.id === id), [items])

  const toggle = useCallback((item: WishlistItem) => {
    setItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [item, ...prev]
    )
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const value = useMemo(() => ({ items, isSaved, toggle, remove }), [items, isSaved, toggle, remove])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return ctx
}
