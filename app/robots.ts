import { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/seo'

/**
 * Yapay zekâ arama/yanıt motorlarının tarayıcıları — açıkça izinli (ChatGPT
 * Search, Perplexity, Claude, Gemini, Copilot, Apple Intelligence yanıtlarında
 * site kaynak olarak gösterilebilsin). Kurallar genel kuralla aynı.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Bingbot',
  'DuckAssistBot',
  'Meta-ExternalAgent',
  'YandexBot',
]

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl()
  const disallow = DISALLOW
  // /api/ kapalı ama paylaşım görselleri (og:image) açık olmalı — X/Twitter
  // gibi robots.txt'ye uyan önizleme botları görseli yoksa kartı boş gösterir.
  const allow = ['/', '/api/og']
  return {
    rules: [
      { userAgent: '*', allow, disallow },
      { userAgent: AI_CRAWLERS, allow, disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}

const DISALLOW: string[] = [
  '/api/',
  '/admin/',
  // NOT: '/_next/' eskiden burada engelliydi — Google sayfayı render ederken
  // JS/CSS (/_next/static) ve optimize görselleri (/_next/image) indiremiyordu.
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
]
