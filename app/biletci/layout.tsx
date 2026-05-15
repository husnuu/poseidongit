import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Biletçi',
  robots: { index: false, follow: false },
}

export default function BiletciLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
