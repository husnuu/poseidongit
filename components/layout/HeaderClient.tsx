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
  Info,
  Megaphone,
  Percent,
  Ship,
  Sparkles,
  Star,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import { urlFor } from '@/lib/sanity'
import type { AnnouncementBarData } from './announcementBarTypes'
import styles from './Header.module.css'

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

  const list = languages.length > 0 ? languages : DEFAULT_HEADER_LANGUAGES
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
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const aria = headerAria(locale)

  const announcementText =
    (locale === 'en' && announcementBar?.textEn?.trim()) ||
    (locale === 'de' && announcementBar?.textDe?.trim()) ||
    announcementBar?.text?.trim() ||
    ''
  const showAnnouncement = Boolean(announcementBar?.enabled && announcementText)
  const linkTrimmed = announcementBar?.linkUrl?.trim() ?? ''
  const linkResolved = linkTrimmed ? localizeNavHref(locale, linkTrimmed) : '#'
  const hasWorkingLink = Boolean(linkTrimmed && linkResolved !== '#')

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      if (y > lastScrollY.current && y > SCROLL_THRESHOLD) {
        setHeaderVisible(false)
      } else {
        setHeaderVisible(true)
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const logoUrl = settings.logo?.asset
    ? urlFor(settings.logo.asset).width(220).height(60).url()
    : settings.logo?.url ?? null

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
        <div className={styles.announcementStrip} role="region" aria-label={aria.announcement}>
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
      <header className={`${styles.header} ${!headerVisible ? styles.headerHidden : ''}`}>
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
