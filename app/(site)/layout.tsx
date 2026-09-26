import { Suspense } from 'react'
import WhatsAppFloatButtonRoot from '@/components/WhatsAppFloatButtonRoot'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // DIN Next LT Pro'yu (rezervasyon sihirbazındakiyle aynı font) tüm müşteri
    // sayfalarına (Header/Footer dahil) uygulayan kapsam — bkz. globals.css .siteFontScope
    <div className="siteFontScope">
      {children}
      <Suspense fallback={null}>
        <WhatsAppFloatButtonRoot />
      </Suspense>
    </div>
  )
}
