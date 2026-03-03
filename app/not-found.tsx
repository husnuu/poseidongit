import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Sayfa bulunamadı</h1>
      <p className="text-zinc-600 mb-6">Aradığınız sayfa mevcut değil.</p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
      >
        Ana sayfaya dön
      </Link>
    </div>
  )
}
