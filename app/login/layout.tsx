import { Suspense } from 'react'

/** Giriş sayfası useSearchParams kullanıyor; statik derleme bunun için bir Suspense sınırı ister. */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
