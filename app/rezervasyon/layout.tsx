// Bu route grubu ((site)/[locale] dışında, locale önekisiz: /rezervasyon/onaylandi,
// /rezervasyon/basarisiz) sitenin geri kalanıyla aynı tipografi ayarlarını
// kullansın diye .siteFontScope sarmalayıcısını burada da uyguluyoruz —
// daha önce bu sayfalar hiçbir kapsamı almadığı için (bu sayfalara özgü bir
// tutarsızlık, deploy/cache sorunu değil) diğer sayfalarla senkron değildi.
export default function RezervasyonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="siteFontScope">{children}</div>
}
