// bkz. app/rezervasyon/layout.tsx — aynı sebeple (bu route grubu da (site)/[locale]
// dışında kaldığı için) ödeme sonucu sayfaları (success/fail/redirect) de
// .siteFontScope kapsamına alınıyor.
export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="siteFontScope">{children}</div>
}
