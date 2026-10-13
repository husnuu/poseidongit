import { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          // Rezervasyon yönetimi (token ile erişilen, kişiye özel) — tüm
          // diller. Public URL'ler lib/i18n/routeAliases.ts'teki
          // REZ_SUB_OUT_* eşlemelerinden (bkz. SEO denetimi).
          '/rezervasyon/yonet',
          '/en/booking/manage',
          '/de/buchung/verwalten',
          '/ru/бронирование/управление',
          '/rezervasyon/basarisiz',
          '/rezervasyon/onaylandi',
          // Bilet/ödeme — rezervasyona özel, token ile erişilen sayfalar
          // (ayrıca kendi metadata'larında noindex de var).
          '/bilet/',
          '/en/ticket/',
          '/de/bilet/',
          '/ru/билет/',
          '/odeme/',
          '/payment/',
          // Biletçi/acente iç paneli ve giriş ekranı.
          '/biletci',
          '/login',
          // Yapılandırılmış veri önizleme sayfası (zaten noindex de var).
          '/seo/schema',
          '/en/seo/schema',
          '/de/seo/schema',
          '/ru/seo/schema',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
