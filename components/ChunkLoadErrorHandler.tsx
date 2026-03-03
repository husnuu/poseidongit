'use client'

import { useEffect, useState } from 'react'

export default function ChunkLoadErrorHandler() {
  const [showReload, setShowReload] = useState(false)

  useEffect(() => {
    const isChunkError = (msg: string) =>
      msg.includes('Loading chunk') ||
      msg.includes('ChunkLoadError') ||
      msg.includes('Failed to fetch dynamically imported module')

    const handleError = (e: ErrorEvent) => {
      if (isChunkError(e.message ?? '')) setShowReload(true)
    }
    const handleRejection = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message ?? e.reason ?? '')
      if (isChunkError(msg)) setShowReload(true)
    }
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  if (!showReload) return null

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-[9999] rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-medium text-white shadow-lg sm:left-auto sm:right-4 sm:max-w-sm"
    >
      <p className="mb-2">Sayfa güncellendi veya bağlantı kesildi.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded bg-white/20 px-3 py-1.5 font-medium hover:bg-white/30"
      >
        Sayfayı yenile
      </button>
    </div>
  )
}
