'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { urlFor } from '@/lib/sanity'
import styles from './Header.module.css'

const EMOJI_FALLBACK: Record<string, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
}

export interface HeaderLanguage {
  code: string
  label: string
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
  headerNav?: Array<{ label: string; href: string }>
  cta?: { text?: string; href?: string }
  headerLanguages?: HeaderLanguage[] | null
}

interface HeaderClientProps {
  settings: SiteSettings
}

/** Geçerli bir path veya URL ise döndür, değilse "#" (RSC/serialization hatalarını önler). */
function safeHref(href: unknown): string {
  if (typeof href !== 'string' || !href) return '#'
  const t = href.trim()
  if (t.startsWith('/') || t.startsWith('http://') || t.startsWith('https://')) return t
  return '#'
}

function LanguageDropdown({ languages }: { languages: HeaderLanguage[] }) {
  const [current, setCurrent] = useState<string>(languages[0]?.code ?? 'tr')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const list = languages.length > 0 ? languages : DEFAULT_HEADER_LANGUAGES
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
        aria-label="Dil seçin"
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
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className={styles.languageDropdown} role="listbox">
          {list.map((item) => {
            const key = item.code.toLowerCase()
            const isSelected = current === key
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.languageOption} ${isSelected ? styles.languageOptionSelected : ''}`}
                onClick={() => {
                  setCurrent(key)
                  setOpen(false)
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
                <span>{item.label}</span>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const SCROLL_THRESHOLD = 60

export default function HeaderClient({ settings }: HeaderClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)

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

  return (
    <>
      <div className={styles.headerSpacer} aria-hidden />
      <header
        className={`${styles.header} ${!headerVisible ? styles.headerHidden : ''}`}
      >
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link href="/" className={styles.logoLink} aria-label="Ana sayfa">
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
            <nav className={styles.desktopNav} aria-label="Ana menü">
              <ul className={styles.desktopNavList}>
                {(settings.headerNav || []).map((item, i) => (
                  <li key={i}>
                    <Link href={safeHref(item.href)} className={styles.desktopNavLink}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <LanguageDropdown
              languages={settings.headerLanguages?.length ? settings.headerLanguages : DEFAULT_HEADER_LANGUAGES}
            />
            <div className={styles.mobileRightBlock}>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setMobileOpen(true)}
                aria-label="Menüyü aç"
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
          aria-label="Mobil menü"
        >
          <div className={styles.mobileMenuContent}>
            <div className={styles.mobileMenuHeader}>
              <Link
                href="/"
                className={styles.mobileMenuLogo}
                onClick={() => setMobileOpen(false)}
              >
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={settings.siteName || 'Logo'}
                    width={220}
                    height={60}
                    className={styles.mobileMenuLogoImage}
                  />
                ) : (
                  <span className={styles.logoFallback}>{settings.siteName || 'Site'}</span>
                )}
              </Link>
              <button
                type="button"
                className={styles.mobileMenuClose}
                onClick={() => setMobileOpen(false)}
                aria-label="Menüyü kapat"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className={styles.mobileMenuNav} aria-label="Mobil menü">
              <ul className={styles.mobileMenuNavList}>
                {(settings.headerNav || []).map((item, i) => (
                  <li key={i} className={styles.mobileMenuNavItem}>
                    <Link
                      href={safeHref(item.href)}
                      className={styles.mobileMenuLink}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
