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
          '/rezervasyon/yonet',
          '/_next/',
          '/private/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
