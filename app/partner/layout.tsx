import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Poseidon Partner',
  robots: { index: false, follow: false },
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: 'var(--font-family)' }}>{children}</div>
}
