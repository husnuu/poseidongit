'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { localizeNavHref } from '@/lib/i18n/localizeNavHref'
import { comingSoonLabelForLanguageCode, headerAria, pickCtaText, pickNavLabel } from '@/lib/i18n/localizedLabels'
import {
  Anchor,
  Bell,
  Calendar,
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
    groupYacht: 'YATLAR',
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
}: {
  languages: HeaderLanguage[]
  locale: SiteLocale
  ariaLabel: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const aria = headerAria(locale)

  // Almanca artık tam destekleniyor — CMS'te "yakında" işaretli kalmış olsa bile kilidi kaldır.
  const list = (languages.length > 0 ? languages : DEFAULT_HEADER_LANGUAGES).map((item) =>
    item.code.toLowerCase() === 'de' ? { ...item, comingSoon: false } : item
  )
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
        className={styles.languageTrigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className={styles.languageTriggerLabel}>
          <span className={styles.languageTriggerFlag} aria-hidden>
            {currentItem?.flag?.url ? (
              <Image
                src={currentItem.flag.url}
                alt=""
                width={28}
                height={28}
                className={styles.languageTriggerFlagImg}
              />
            ) : (
              <span className={styles.languageTriggerFlagInner}>
                {EMOJI_FALLBACK[currentItem?.code?.toLowerCase() ?? 'tr'] ?? '🇹🇷'}
              </span>
            )}
          </span>
          <span className={styles.languageTriggerLabelText}>{currentItem?.label}</span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          className={styles.languageCaret}
          viewBox="0 0 24 24"
          width={16}
          height={16}
          aria-hidden
          focusable="false"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
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
                    {item.flag?.url ? (
                      <Image
                        src={item.flag.url}
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
                  {item.flag?.url ? (
                    <Image
                      src={item.flag.url}
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
    'text-sm font-medium leading-snug text-white sm:text-[15px] [&_a]:underline'

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
      <span className={announcementTextClass}>{announcementText}</span>
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
                {(settings.headerNav || []).map((item, i) => (
                  <li key={i}>
                    <Link href={localizeNavHref(locale, item.href)} className={styles.desktopNavLink}>
                      {pickNavLabel(item, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {showCta && ctaHref && (
              <div className={styles.headerCtaWrap}>
                <Link href={ctaHref} className={styles.headerCta}>
                  {ctaLabel}
                </Link>
              </div>
            )}
            <LanguageDropdown
              locale={locale}
              ariaLabel={aria.selectLanguage}
              languages={settings.headerLanguages?.length ? settings.headerLanguages : DEFAULT_HEADER_LANGUAGES}
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
                              {item.priceLabel && (
                                <span className={styles.wishlistItemPrice}>{item.priceLabel}</span>
                              )}
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
