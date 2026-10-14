'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { localizeNavHref } from '@/lib/i18n/localizeNavHref'
import { comingSoonLabelForLanguageCode, headerAria, pickCtaText, pickNavLabel } from '@/lib/i18n/localizedLabels'
import {
  Anchor,
  Bell,
  Calendar,
  Check,
  Globe,
  Heart,
  Info,
  Megaphone,
  Percent,
  Ship,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { urlFor } from '@/lib/sanity'
import type { AnnouncementBarData } from './announcementBarTypes'
import { useWishlist, type WishlistItem } from '@/lib/wishlist/WishlistContext'
import styles from './Header.module.css'

const WISHLIST_LABELS: Record<
  SiteLocale,
  {
    open: string
    title: string
    emptyTitle: string
    emptyBody: string
    remove: string
    close: string
    groupTour: string
    groupYacht: string
  }
> = {
  tr: {
    open: 'Favoriler',
    title: 'KAYDEDİLENLER',
    emptyTitle: 'Henüz bir şey kaydetmediniz.',
    emptyBody: 'Bir tur veya yatın üzerindeki kalbe dokunarak buraya kaydedin.',
    remove: 'Kaldır',
    close: 'Kapat',
    groupTour: 'TURLAR',
    groupYacht: 'TEKNELER',
  },
  en: {
    open: 'Wishlist',
    title: 'SAVED',
    emptyTitle: "You haven't saved anything yet.",
    emptyBody: 'Tap the heart on a tour or yacht to save it here.',
    remove: 'Remove',
    close: 'Close',
    groupTour: 'TOURS',
    groupYacht: 'YACHTS',
  },
  de: {
    open: 'Merkliste',
    title: 'GESPEICHERT',
    emptyTitle: 'Noch nichts gespeichert.',
    emptyBody: 'Tippen Sie auf das Herz einer Tour oder Yacht, um sie hier zu speichern.',
    remove: 'Entfernen',
    close: 'Schließen',
    groupTour: 'TOUREN',
    groupYacht: 'YACHTEN',
  },
  ru: {
    open: 'Избранное',
    title: 'СОХРАНЁННОЕ',
    emptyTitle: 'Вы ещё ничего не сохранили.',
    emptyBody: 'Нажмите на сердечко у тура или яхты, чтобы сохранить его здесь.',
    remove: 'Удалить',
    close: 'Закрыть',
    groupTour: 'ТУРЫ',
    groupYacht: 'ЯХТЫ',
  },
}

const ANNOUNCEMENT_ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  info: Info,
  bell: Bell,
  sparkles: Sparkles,
  tag: Tag,
  percent: Percent,
  anchor: Anchor,
  calendar: Calendar,
  ship: Ship,
  star: Star,
}

function announcementIconComponent(iconKey: string | null | undefined): LucideIcon | null {
  if (!iconKey || iconKey === 'none') return null
  return ANNOUNCEMENT_ICONS[iconKey] ?? null
}

const EMOJI_FALLBACK: Record<string, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  ru: '🇷🇺',
}

/** TR/EN/DE bayrakları Sanity'de yüklü görsel olarak geliyor; "ru" için editör henüz
    bir görsel yüklemediyse metin emoji yerine gerçek bir bayrak görseli göstersin diye
    yerel bir SVG — Sanity'de bir gün görsel yüklenirse o öncelikli kalır. */
const LOCAL_FLAG_FALLBACK: Record<string, string> = {
  ru: '/flags/ru.svg',
}

const LANG_SECTION_LABEL: Record<SiteLocale, string> = {
  tr: 'DİL',
  en: 'LANGUAGE',
  de: 'SPRACHE',
  ru: 'ЯЗЫК',
}

/** Almanca ve Rusça artık tam destekleniyor — CMS'te "yakında" işaretli kalmış olsa bile kilidi kaldır. */
function normalizeLanguages(languages: HeaderLanguage[]): HeaderLanguage[] {
  return (languages.length > 0 ? languages : DEFAULT_HEADER_LANGUAGES).map((item) =>
    item.code.toLowerCase() === 'de' || item.code.toLowerCase() === 'ru'
      ? { ...item, comingSoon: false }
      : item
  )
}

export interface HeaderLanguage {
  code: string
  label: string
  comingSoon?: boolean | null
  comingSoonBadge?: {
    asset?: { _ref?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
  } | null
  flag?: {
    asset?: { _ref?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
  }
}

const DEFAULT_HEADER_LANGUAGES: HeaderLanguage[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: 'Русский' },
]

interface SiteSettings {
  siteName?: string
  tagline?: string
  logo?: {
    asset?: { _ref?: string; _type?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
  }
  headerNav?: Array<{ label: string; href: string; labelEn?: string; labelDe?: string }>
  cta?: { text?: string; href?: string; textEn?: string; textDe?: string }
  headerLanguages?: HeaderLanguage[] | null
}

interface HeaderClientProps {
  locale: SiteLocale
  settings: SiteSettings
  announcementBar?: AnnouncementBarData | null
  /** SSR ile spacer doğru kalsın diye tahmini yükseklik (px) */
  announcementFallbackHeightPx?: number
}

/** Geçerli bir path veya URL ise döndür, değilse "#" (RSC/serialization hatalarını önler). */
function safeHref(href: unknown): string {
  if (typeof href !== 'string' || !href) return '#'
  const t = href.trim()
  if (
    t.startsWith('/') ||
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('mailto:') ||
    t.startsWith('tel:')
  ) {
    return t
  }
  return '#'
}

function LanguageDropdown({
  languages,
  locale,
  ariaLabel,
  compact,
}: {
  languages: HeaderLanguage[]
  locale: SiteLocale
  ariaLabel: string
  /** Header aşağı kaydırılınca true — tetikleyicide bayrak/metin yerine
      sade bir globe ikonu gösterilir (açılan menü aynı kalır). */
  compact?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const aria = headerAria(locale)

  const list = normalizeLanguages(languages)
  const current = locale
  const currentItem = list.find((item) => item.code.toLowerCase() === current) ?? list[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  if (list.length === 0) return null

  return (
    <div className={styles.languageSelector} ref={ref}>
      <button
        type="button"
        className={`${styles.languageTrigger} ${compact ? styles.languageTriggerCompact : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className={styles.languageTriggerLabel}>
          <Globe className={styles.languageGlobeIcon} strokeWidth={2} aria-hidden />
          {!compact && <span className={styles.languageTriggerLabelText}>{currentItem?.label}</span>}
        </span>
      </button>
      {open && (
        <div className={styles.languageDropdown} role="listbox">
          {list.map((item) => {
            const key = item.code.toLowerCase()
            const isSelected = current === key
            const soon = Boolean(item.comingSoon)

            if (soon) {
              const soonLabel = comingSoonLabelForLanguageCode(key)
              return (
                <div
                  key={key}
                  role="option"
                  aria-disabled="true"
                  aria-selected={false}
                  title={`${item.label} — ${soonLabel}`}
                  className={`${styles.languageOption} ${styles.languageOptionComingSoon}`}
                >
                  <span className={styles.languageOptionFlag}>
                    {item.flag?.url || LOCAL_FLAG_FALLBACK[key] ? (
                      <Image
                        src={item.flag?.url || LOCAL_FLAG_FALLBACK[key]}
                        alt=""
                        width={24}
                        height={24}
                        className={styles.languageOptionFlagImg}
                      />
                    ) : (
                      <span className={styles.languageOptionFlagInner}>
                        {EMOJI_FALLBACK[key] ?? '🇹🇷'}
                      </span>
                    )}
                  </span>
                  <span className={styles.languageOptionLabel}>{item.label}</span>
                  {item.comingSoonBadge?.url ? (
                    <Image
                      src={item.comingSoonBadge.url}
                      alt={soonLabel}
                      width={72}
                      height={20}
                      className={styles.languageComingSoonBadgeImg}
                    />
                  ) : (
                    <span className={styles.languageComingSoonFallback}>{soonLabel}</span>
                  )}
                </div>
              )
            }

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.languageOption} ${isSelected ? styles.languageOptionSelected : ''}`}
                onClick={() => {
                  setOpen(false)
                  if (!isSiteLocale(key)) return
                  router.push(withLocalePath(key, '/'))
                }}
              >
                <span className={styles.languageOptionFlag}>
                  {item.flag?.url || LOCAL_FLAG_FALLBACK[key] ? (
                    <Image
                      src={item.flag?.url || LOCAL_FLAG_FALLBACK[key]}
                      alt=""
                      width={24}
                      height={24}
                      className={styles.languageOptionFlagImg}
                    />
                  ) : (
                    <span className={styles.languageOptionFlagInner}>
                      {EMOJI_FALLBACK[key] ?? '🇹🇷'}
                    </span>
                  )}
                </span>
                <span className={styles.languageOptionLabel}>{item.label}</span>
                {isSelected && <span className={styles.languageOptionDot} aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Mobil menüde dropdown yerine referans siteki gibi düz, hap şeklinde dil
    seçenekleri listesi — seçili olan beyaz zeminde onay işaretiyle öne çıkar. */
function MobileLanguageList({
  languages,
  locale,
  onNavigate,
}: {
  languages: HeaderLanguage[]
  locale: SiteLocale
  onNavigate?: () => void
}) {
  const router = useRouter()
  const list = normalizeLanguages(languages)
  const sectionLabel = LANG_SECTION_LABEL[locale] ?? LANG_SECTION_LABEL.tr

  if (list.length === 0) return null

  return (
    <div className={styles.mobileMenuLangSection}>
      <span className={styles.mobileMenuLangLabel}>{sectionLabel}</span>
      <div className={styles.mobileMenuLangList}>
        {list.map((item) => {
          const key = item.code.toLowerCase()
          const isSelected = locale === key
          const soon = Boolean(item.comingSoon)
          const flag = item.flag?.url || LOCAL_FLAG_FALLBACK[key] ? (
            <Image
              src={item.flag?.url || LOCAL_FLAG_FALLBACK[key]}
              alt=""
              width={26}
              height={26}
              className={styles.mobileMenuLangFlagImg}
            />
          ) : (
            <span className={styles.mobileMenuLangFlagInner}>{EMOJI_FALLBACK[key] ?? '🇹🇷'}</span>
          )

          if (soon) {
            const soonLabel = comingSoonLabelForLanguageCode(key)
            return (
              <div
                key={key}
                role="option"
                aria-disabled="true"
                aria-selected={false}
                className={`${styles.mobileMenuLangOption} ${styles.mobileMenuLangOptionComingSoon}`}
              >
                <span className={styles.mobileMenuLangFlag}>{flag}</span>
                <span className={styles.mobileMenuLangOptionLabel}>{item.label}</span>
                <span className={styles.mobileMenuLangComingSoonBadge}>{soonLabel}</span>
              </div>
            )
          }

          return (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={`${styles.mobileMenuLangOption} ${isSelected ? styles.mobileMenuLangOptionSelected : ''}`}
              onClick={() => {
                onNavigate?.()
                if (!isSiteLocale(key)) return
                router.push(withLocalePath(key, '/'))
              }}
            >
              <span className={styles.mobileMenuLangFlag}>{flag}</span>
              <span className={styles.mobileMenuLangOptionLabel}>{item.label}</span>
              {isSelected && <Check className={styles.mobileMenuLangCheck} aria-hidden />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const SCROLL_THRESHOLD = 60

function isExternalHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

function isMailtoOrTel(href: string): boolean {
  return /^mailto:|^tel:/i.test(href)
}

/** /en/foo, /de/foo, /tr/foo → /foo (ve sondaki "/" kırpılır). */
function normalizeNavPath(path: string): string {
  let p = path.trim()
  if (!p.startsWith('/')) return p.toLowerCase()
  for (const pref of ['/en', '/de', '/tr'] as const) {
    if (p === pref) {
      p = '/'
      break
    }
    if (p.startsWith(`${pref}/`)) {
      p = p.slice(pref.length) || '/'
      break
    }
  }
  p = p.split('?')[0] ?? p
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p.toLowerCase()
}

/** Detay sayfalarının (örn. /tur/[slug]) tekil kök segmenti, listeleme sayfasının
    (/turlar) çoğul segmentinden farklı olduğu tek durum — menüde aktif göstermek için. */
const NAV_ROOT_ALIASES: Record<string, string> = { '/tur': '/turlar' }

/** Geçerli sayfa bu menü öğesine mi ait? (tam eşleşme veya alt sayfa — /feribot/xyz → /feribot gibi) */
function isNavItemActive(currentPath: string, itemHref: string): boolean {
  if (isExternalHttpUrl(itemHref) || isMailtoOrTel(itemHref)) return false
  const current = normalizeNavPath(currentPath)
  const item = normalizeNavPath(itemHref)
  if (item === '/') return current === '/'
  if (current === item || current.startsWith(`${item}/`)) return true
  const currentRoot = `/${current.split('/')[1] ?? ''}`
  return NAV_ROOT_ALIASES[currentRoot] === item
}

export default function HeaderClient({
  locale,
  settings,
  announcementBar = null,
}: HeaderClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [headerTop, setHeaderTop] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const announcementRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const aria = headerAria(locale)
  const pathname = usePathname()
  const { items: wishlistItems, remove: removeFromWishlist } = useWishlist()

  const announcementText =
    (locale === 'en' && announcementBar?.textEn?.trim()) ||
    (locale === 'de' && announcementBar?.textDe?.trim()) ||
    announcementBar?.text?.trim() ||
    ''
  const showAnnouncement = Boolean(announcementBar?.enabled && announcementText)
  const linkTrimmed = announcementBar?.linkUrl?.trim() ?? ''
  const linkResolved = linkTrimmed ? localizeNavHref(locale, linkTrimmed) : '#'
  const hasWorkingLink = Boolean(linkTrimmed && linkResolved !== '#')

  // Header'ı gerçek anlamda viewport'a sabitler (native `position: sticky`,
  // body'deki global `overflow-x: hidden` yüzünden çalışmıyor — bu yüzden
  // duyuru şeridinin kalan yüksekliğini scroll'a göre hesaplayıp `fixed` ile taklit ediyoruz).
  useEffect(() => {
    function measure() {
      const annH = announcementRef.current?.offsetHeight ?? 0
      const hdrH = headerRef.current?.offsetHeight ?? 0
      setHeaderHeight(hdrH)
      // Sayfa içindeki `position: sticky` öğeler (tur/yat rezervasyon kartı)
      // fixed header'ın ALTINA girmesin diye gerçek ölçülen yüksekliği CSS'e
      // açıyoruz — sabit bir sayı yazmak yerine (logo/duyuru değişirse kayar).
      if (hdrH > 0) {
        document.documentElement.style.setProperty('--site-header-h', `${hdrH}px`)
      }
      setHeaderTop(Math.max(0, annH - window.scrollY))
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [showAnnouncement])

  useEffect(() => {
    if (!wishlistOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setWishlistOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [wishlistOpen])

  useEffect(() => {
    if (!mobileOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const logoUrl = settings.logo?.asset
    ? urlFor(settings.logo.asset).width(220).height(60).url()
    : settings.logo?.url ?? null

  const wishlistGroups: { label: string; items: WishlistItem[] }[] = [
    { label: WISHLIST_LABELS[locale].groupTour, items: wishlistItems.filter((i) => i.type === 'tour') },
    { label: WISHLIST_LABELS[locale].groupYacht, items: wishlistItems.filter((i) => i.type === 'yacht') },
  ].filter((g) => g.items.length > 0)

  const AnnouncementIcon = announcementIconComponent(announcementBar?.icon)
  const announcementInnerClass =
    'mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4 py-2.5 text-center sm:px-6'
  const announcementTextClass =
    'text-sm leading-snug text-white sm:text-[15px] [&_a]:underline'

  const ctaLabel = pickCtaText(settings.cta, locale)
  const ctaHrefRaw = settings.cta?.href?.trim()
  const ctaHref =
    ctaHrefRaw && safeHref(ctaHrefRaw) !== '#'
      ? localizeNavHref(locale, safeHref(ctaHrefRaw))
      : null
  const showCta = Boolean(ctaLabel && ctaHref)

  const announcementInner = (
    <>
      {AnnouncementIcon ? (
        <AnnouncementIcon className="h-4 w-4 shrink-0 text-white/95" strokeWidth={2} aria-hidden />
      ) : null}
      <span className={announcementTextClass} style={{ fontWeight: 500 }}>
        {announcementText}
      </span>
    </>
  )

  return (
    <div className={`${styles.siteHeaderStack} print:hidden`}>
      {showAnnouncement && (
        <div ref={announcementRef} className={styles.announcementStrip} role="region" aria-label={aria.announcement}>
          {hasWorkingLink ? (
            isExternalHttpUrl(linkResolved) ? (
              <a
                href={linkResolved}
                className={`${announcementInnerClass} block text-white no-underline transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {announcementInner}
              </a>
            ) : isMailtoOrTel(linkResolved) ? (
              <a
                href={linkResolved}
                className={`${announcementInnerClass} block text-white no-underline transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              >
                {announcementInner}
              </a>
            ) : (
              <Link
                href={linkResolved}
                className={`${announcementInnerClass} block text-white no-underline transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              >
                {announcementInner}
              </Link>
            )
          ) : (
            <div className={announcementInnerClass}>{announcementInner}</div>
          )}
        </div>
      )}
      <header
        ref={headerRef}
        className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}
        style={{ top: headerTop }}
      >
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link href={withLocalePath(locale, '/')} className={styles.logoLink} aria-label={aria.home}>
              <div className={styles.logoWrapper}>
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={settings.siteName || 'Logo'}
                    width={220}
                    height={55}
                    className={styles.logoImage}
                    priority
                  />
                ) : (
                  <span className={styles.logoFallback}>{settings.siteName || 'Site'}</span>
                )}
              </div>
            </Link>
          </div>

          <div className={styles.headerRight}>
            <nav className={styles.desktopNav} aria-label={aria.mainNav}>
              <ul className={styles.desktopNavList}>
                {(settings.headerNav || []).map((item, i) => {
                  const active = isNavItemActive(pathname ?? '/', item.href)
                  return (
                    <li key={i}>
                      <Link
                        href={localizeNavHref(locale, item.href)}
                        className={`${styles.desktopNavLink} ${active ? styles.desktopNavLinkActive : ''}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        {pickNavLabel(item, locale)}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            {showCta && ctaHref && (
              <div className={styles.headerCtaWrap}>
                <Link href={ctaHref} className={styles.headerCta}>
                  {ctaLabel}
                </Link>
              </div>
            )}
            <span className={styles.headerDivider} aria-hidden="true" />
            <LanguageDropdown
              locale={locale}
              ariaLabel={aria.selectLanguage}
              languages={settings.headerLanguages?.length ? settings.headerLanguages : DEFAULT_HEADER_LANGUAGES}
              compact={scrolled}
            />
            <div className={styles.wishlistWrap}>
              <button
                type="button"
                className={styles.wishlistTrigger}
                onClick={() => setWishlistOpen(true)}
                aria-expanded={wishlistOpen}
                aria-haspopup="dialog"
                aria-label={WISHLIST_LABELS[locale].open}
              >
                <Heart className={styles.wishlistIcon} strokeWidth={2} fill="none" aria-hidden />
                {wishlistItems.length > 0 && (
                  <span className={styles.wishlistCount}>{wishlistItems.length}</span>
                )}
              </button>
            </div>
            <div className={styles.mobileRightBlock}>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setMobileOpen(true)}
                aria-label={aria.openMenu}
                aria-expanded={mobileOpen}
                aria-haspopup="dialog"
              >
                <span className={styles.hamburgerIcon} aria-hidden>
                  <MenuIcon />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <div style={{ height: headerHeight }} aria-hidden />

      {wishlistOpen && (
        <div
          className={styles.wishlistOverlay}
          onClick={() => setWishlistOpen(false)}
        >
          <div
            className={styles.wishlistDrawer}
            role="dialog"
            aria-modal="true"
            aria-label={WISHLIST_LABELS[locale].title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.wishlistDrawerHeader}>
              <span className={styles.wishlistDrawerTitle}>
                {WISHLIST_LABELS[locale].title}
                {wishlistItems.length > 0 && (
                  <span className={styles.wishlistDrawerCount}>{wishlistItems.length}</span>
                )}
              </span>
              <button
                type="button"
                className={styles.wishlistDrawerClose}
                onClick={() => setWishlistOpen(false)}
                aria-label={WISHLIST_LABELS[locale].close}
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            {wishlistItems.length === 0 ? (
              <div className={styles.wishlistEmptyState}>
                <Heart className={styles.wishlistEmptyIcon} strokeWidth={1.5} aria-hidden />
                <p className={styles.wishlistEmptyTitle}>{WISHLIST_LABELS[locale].emptyTitle}</p>
                <p className={styles.wishlistEmptyBody}>{WISHLIST_LABELS[locale].emptyBody}</p>
              </div>
            ) : (
              <div className={styles.wishlistDrawerBody}>
                {wishlistGroups.map((group) => (
                  <div key={group.label} className={styles.wishlistGroup}>
                    <div className={styles.wishlistGroupLabel}>{group.label}</div>
                    <ul className={styles.wishlistList}>
                      {group.items.map((item) => (
                        <li key={item.id} className={styles.wishlistItem}>
                          <Link
                            href={item.href}
                            className={styles.wishlistItemLink}
                            onClick={() => setWishlistOpen(false)}
                          >
                            <span className={styles.wishlistItemThumb}>
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title}
                                  width={64}
                                  height={64}
                                  className={styles.wishlistItemThumbImg}
                                />
                              ) : null}
                            </span>
                            <span className={styles.wishlistItemInfo}>
                              <span className={styles.wishlistItemTitle}>{item.title}</span>
                            </span>
                          </Link>
                          <button
                            type="button"
                            className={styles.wishlistItemRemove}
                            onClick={() => removeFromWishlist(item.id)}
                            aria-label={WISHLIST_LABELS[locale].remove}
                          >
                            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {mobileOpen && (
        <div
          className={`${styles.mobileMenuOverlay} ${mobileOpen ? '' : styles.closing}`}
          role="dialog"
          aria-modal="true"
          aria-label={aria.mobileMenu}
        >
          <div className={styles.mobileMenuContent}>
            <div className={styles.mobileMenuHeader}>
              <Link
                href={withLocalePath(locale, '/')}
                className={styles.mobileMenuLogo}
                onClick={() => setMobileOpen(false)}
                aria-label={aria.home}
              >
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={settings.siteName || 'Logo'}
                    width={220}
                    height={60}
                    className={`${styles.mobileMenuLogoImage} ${styles.logoImageOnDark}`}
                  />
                ) : (
                  <span className={styles.logoFallback}>{settings.siteName || 'Site'}</span>
                )}
              </Link>
              <button
                type="button"
                className={styles.mobileMenuClose}
                onClick={() => setMobileOpen(false)}
                aria-label={aria.closeMenu}
              >
                <CloseIcon />
              </button>
            </div>
            <nav className={styles.mobileMenuNav} aria-label={aria.mobileMenu}>
              <ul className={styles.mobileMenuNavList}>
                {(settings.headerNav || []).map((item, i) => (
                  <li key={i} className={styles.mobileMenuNavItem}>
                    <Link
                      href={localizeNavHref(locale, item.href)}
                      className={styles.mobileMenuLink}
                      onClick={() => setMobileOpen(false)}
                    >
                      {pickNavLabel(item, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <MobileLanguageList
              locale={locale}
              languages={settings.headerLanguages?.length ? settings.headerLanguages : DEFAULT_HEADER_LANGUAGES}
              onNavigate={() => setMobileOpen(false)}
            />
            {showCta && ctaHref && (
              <div className={styles.mobileMenuCta}>
                <Link
                  href={ctaHref}
                  className={styles.headerCta}
                  onClick={() => setMobileOpen(false)}
                >
                  {ctaLabel}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
