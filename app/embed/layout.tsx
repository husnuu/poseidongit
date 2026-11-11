import type { Metadata } from 'next'
import EmbedShell from '@/components/embed/EmbedShell'

/** Partner sitelerine gömülen widget sayfaları: arama motorlarında görünmez. */
export const metadata: Metadata = {
  title: 'Poseidon',
  robots: { index: false, follow: false },
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <EmbedShell>{children}</EmbedShell>
}
