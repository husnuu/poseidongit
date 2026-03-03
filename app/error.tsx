'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">Bir hata oluştu</h1>
      <p className="text-zinc-600 text-center mb-6 max-w-md">
        Sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
      >
        Tekrar dene
      </button>
    </div>
  )
}
