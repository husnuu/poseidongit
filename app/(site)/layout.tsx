import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppFloatButtonRoot from '@/components/WhatsAppFloatButtonRoot'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <Suspense fallback={null}>
        <WhatsAppFloatButtonRoot />
      </Suspense>
    </>
  )
}
