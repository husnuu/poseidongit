import Link from 'next/link'

export default function BiletNotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-zinc-200 p-8 text-center">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Rezervasyon bulunamadı</h1>
        <p className="text-zinc-600 mb-6 text-sm">
          Bu bilet numarasına ait rezervasyon sistemde bulunamadı. Lütfen e-postanızdaki linki kontrol edin veya rezervasyon numaranızı doğrulayın.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#0c1929] px-5 py-3 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Ana sayfaya dön
        </Link>
        <p className="mt-6 text-xs text-zinc-500">
          Sorun devam ederse bizimle iletişime geçin.
        </p>
      </div>
    </div>
  )
}
