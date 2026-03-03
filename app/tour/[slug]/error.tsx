'use client'

import Link from 'next/link'

export default function TourError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">Tur yüklenemedi</h1>
      <p className="text-zinc-600 text-center mb-6 max-w-md">
        Bu tur sayfası şu an açılamıyor. Lütfen tekrar deneyin veya ana sayfaya dönün.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
        >
          Tekrar dene
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-100"
        >
          Ana sayfa
        </Link>
      </div>
    </div>
  )
}
