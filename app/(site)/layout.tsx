import { Suspense } from 'react'
import WhatsAppFloatButtonRoot from '@/components/WhatsAppFloatButtonRoot'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <WhatsAppFloatButtonRoot />
      </Suspense>
    </>
  )
}
