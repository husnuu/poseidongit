'use client'

import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import YachtHeroBadgeOverlay from '@/components/yacht/YachtHeroBadgeOverlay'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import { useWishlist } from '@/lib/wishlist/WishlistContext'
import styles from './PhotoGrid.module.css'
import { SANITY_DISPLAY_IMAGE_PROPS } from '@/lib/sanityImage'
import { Image as ImageIcon, Facebook, Heart, Link2, Mail, MessageCircle, Send, Share, Twitter, X as XIcon } from 'lucide-react'

export interface PhotoGridImage {
  src: string
  blurDataURL?: string | null
  alt: string
}

const SHARE_LABELS: Record<SiteLocale, { title: string; copyLink: string; copied: string; close: string; whatsapp: string; email: string; telegram: string; facebook: string; x: string; share: string; wishlist: string }> = {
  tr: {
    title: 'BUNU PAYLAŞ',
    copyLink: 'Bağlantıyı Kopyala',
    copied: 'Kopyalandı!',
    close: 'Kapat',
    whatsapp: 'WhatsApp',
    email: 'E-posta',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X',
    share: 'Paylaş',
    wishlist: 'Favorilere ekle',
  },
  en: {
    title: 'SHARE THIS',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    close: 'Close',
    whatsapp: 'WhatsApp',
    email: 'Email',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X',
    share: 'Share',
    wishlist: 'Add to wishlist',
  },
  de: {
    title: 'TEILEN',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    close: 'Schließen',
    whatsapp: 'WhatsApp',
    email: 'E-Mail',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X',
    share: 'Teilen',
    wishlist: 'Zur Merkliste hinzufügen',
  },
}

interface PhotoGridProps {
  images: PhotoGridImage[]
  tourTitle: string
  /** Yat detay: ana görsel üzerinde şerit rozetler (tur «En Popüler» stili) */
  heroBadges?: string[]
  /** RSC sınırında `tourUi` nesnesi (içinde fonksiyonlar) geçirilemez; yalnızca locale. */
  locale?: SiteLocale
  /** Wishlist + paylaşım linki için: öğe kimliği/slug'ı ve kısa açıklaması */
  tourId?: string | null
  tourSlug?: string | null
  tourDescription?: string | null
  /** Wishlist'e hangi tür olarak kaydedilsin (varsayılan: 'tour') */
  itemType?: 'tour' | 'yacht'
  /** Tur dışı öğeler (ör. yat) için tam sayfa yolu — verilirse tourSlug'dan
      `/tur/...` üretmek yerine doğrudan bu yol kullanılır. */
  itemPath?: string | null
}

export default function PhotoGrid({
  images,
  tourTitle,
  heroBadges,
  locale,
  tourId,
  tourSlug,
  tourDescription,
  itemType = 'tour',
  itemPath,
}: PhotoGridProps) {
  const safeLocale = locale ?? 'tr'
  const tourUi = useMemo(() => getTourPageUi(safeLocale), [safeLocale])
  const shareUi = SHARE_LABELS[safeLocale] ?? SHARE_LABELS.tr
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { isSaved, toggle } = useWishlist()
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const [activeMobileIndex, setActiveMobileIndex] = useState(0)

  const { mainImage, rightImages, hasMainImage } = useMemo(() => {
    const main = images[0]
    const right = images.slice(1, 5)
    return {
      mainImage: main,
      rightImages: right,
      hasMainImage: !!main?.src,
    }
  }, [images])

  const handleMobileScroll = () => {
    const el = mobileScrollRef.current
    if (!el || images.length <= 1) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveMobileIndex(Math.max(0, Math.min(images.length - 1, idx)))
  }

  const wishlistId = tourId || tourSlug || null
  const saved = wishlistId ? isSaved(wishlistId) : false
  const tourHref = itemPath
    ? withLocalePath(safeLocale, itemPath)
    : tourSlug
      ? withLocalePath(safeLocale, `/tur/${tourSlug}`)
      : null

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!wishlistId) return
    toggle({
      id: wishlistId,
      type: itemType,
      title: tourTitle,
      imageUrl: mainImage?.src ?? null,
      priceLabel: null,
      href: tourHref ?? '#',
    })
  }

  const getShareUrl = () => {
    if (typeof window === 'undefined') return tourHref ?? ''
    return tourHref ? `${window.location.origin}${tourHref}` : window.location.href
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* pano erişimi yoksa sessizce yok say */
    }
  }

  const openShareTarget = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shareUrl = shareOpen ? getShareUrl() : ''
  const shareTextEncoded = encodeURIComponent(tourTitle)
  const shareUrlEncoded = encodeURIComponent(shareUrl)

  if (!hasMainImage) return null

  const actionButtons = (
    <>
      <button
        type="button"
        className={styles.actionBtn}
        onClick={(e) => {
          e.stopPropagation()
          setShareOpen(true)
        }}
        aria-label={shareUi.share}
      >
        <Share className={styles.actionIcon} strokeWidth={2} aria-hidden />
      </button>
      {wishlistId && (
        <button
          type="button"
          className={`${styles.actionBtn} ${saved ? styles.actionBtnSaved : ''}`}
          onClick={handleWishlistToggle}
          aria-pressed={saved}
          aria-label={shareUi.wishlist}
        >
          <Heart className={styles.actionIcon} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} aria-hidden />
        </button>
      )}
    </>
  )

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.wrapperInner}>
        {/* DESKTOP: sol tarafta tek büyük görsel + sağda 2x2 küçük görsel — referans
            siteki gibi paylaş/favori/tümünü-gör hepsi sağ-alt karoda tek satırda. */}
        <div className={styles.desktopGrid}>
          <div
            className={styles.main}
            onClick={() => openLightbox(0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(0)}
            aria-label={tourUi.photoGridOpenGallery}
          >
            <Image
              src={mainImage.src}
              alt={tourTitle}
              fill
              className={styles.gridImage}
              placeholder={mainImage.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={mainImage.blurDataURL ?? undefined}
              sizes="50vw"
              {...SANITY_DISPLAY_IMAGE_PROPS}
            />
            {heroBadges && heroBadges.length > 0 ? (
              <div className={styles.mainBadgeLayer}>
                <YachtHeroBadgeOverlay badges={heroBadges} locale={safeLocale} />
              </div>
            ) : null}
          </div>

          {rightImages.map((image, index) => {
            const isBottomRight = index === 3
            const hasImage = !!image?.src
            if (!hasImage) return null
            return (
              <div
                key={`thumb-${index}`}
                className={styles.thumb}
                onClick={() => openLightbox(index + 1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && openLightbox(index + 1)
                }
                aria-label={tourUi.photoGridOpenGallery}
              >
                <Image
                  src={image.src}
                  alt={`${tourTitle} - ${index + 2}`}
                  fill
                  className={styles.gridImage}
                  placeholder={image.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={image.blurDataURL ?? undefined}
                  sizes="25vw"
                  {...SANITY_DISPLAY_IMAGE_PROPS}
                />
                {isBottomRight && (
                  <div className={styles.desktopControls}>
                    {actionButtons}
                    <button
                      type="button"
                      className={styles.viewAllButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        openLightbox(0)
                      }}
                    >
                      <ImageIcon className={styles.viewAllIcon} strokeWidth={2} aria-hidden />
                      {images.length > 5
                        ? tourUi.photoGridSeeAllWithExtra(images.length - 5)
                        : tourUi.photoGridSeeAll}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* MOBİL: tüm fotoğraflar arasında kaydırmalı (swipe) tek şerit + altta nokta
            göstergesi, sağ-üstte paylaş/favori, sağ-altta kompakt fotoğraf sayacı
            (referans siteki gibi — "TÜM FOTOĞRAFLARI GÖR" yazısı yerine sade rakam). */}
        <div className={styles.mobileCarouselWrap}>
          <div
            ref={mobileScrollRef}
            onScroll={handleMobileScroll}
            className={styles.mobileCarousel}
          >
            {images.map((image, index) => (
              <div
                key={`mobile-${index}`}
                className={styles.mobileSlide}
                onClick={() => openLightbox(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openLightbox(index)}
                aria-label={tourUi.photoGridOpenGallery}
              >
                <Image
                  src={image.src}
                  alt={`${tourTitle} - ${index + 1}`}
                  fill
                  className={styles.gridImage}
                  placeholder={image.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={image.blurDataURL ?? undefined}
                  sizes="100vw"
                  priority={index === 0}
                  {...SANITY_DISPLAY_IMAGE_PROPS}
                />
                {index === 0 && heroBadges && heroBadges.length > 0 ? (
                  <div className={styles.mainBadgeLayer}>
                    <YachtHeroBadgeOverlay badges={heroBadges} locale={safeLocale} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className={styles.mobileActionButtons}>{actionButtons}</div>
          {images.length > 1 && (
            <button
              type="button"
              className={styles.mobileCountBadge}
              onClick={(e) => {
                e.stopPropagation()
                openLightbox(activeMobileIndex)
              }}
              aria-label={tourUi.photoGridMobileSeeAllWithCount(images.length)}
            >
              <ImageIcon className={styles.mobileCountIcon} strokeWidth={2} aria-hidden />
              {images.length}
            </button>
          )}
          {images.length > 1 && (
            <div className={styles.mobileDots} aria-hidden>
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === activeMobileIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Paylaşım penceresi */}
      {shareOpen && (
        <div
          className={styles.shareOverlay}
          onClick={() => setShareOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={shareUi.title}
        >
          <div className={styles.sharePanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sharePanelHeader}>
              <span className={styles.sharePanelTitle}>{shareUi.title}</span>
              <button
                type="button"
                className={styles.sharePanelClose}
                onClick={() => setShareOpen(false)}
                aria-label={shareUi.close}
              >
                <XIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className={styles.sharePreview}>
              <span className={styles.sharePreviewThumb}>
                {mainImage?.src && (
                  <Image src={mainImage.src} alt={tourTitle} width={64} height={64} className={styles.sharePreviewThumbImg} />
                )}
              </span>
              <span className={styles.sharePreviewInfo}>
                <span className={styles.sharePreviewTitle}>{tourTitle}</span>
                {tourDescription && <span className={styles.sharePreviewDesc}>{tourDescription}</span>}
              </span>
            </div>

            <div className={styles.shareOptions}>
              <button type="button" className={styles.shareOption} onClick={handleCopyLink}>
                <Link2 className={styles.shareOptionIcon} style={{ color: 'var(--primary, #2168b8)' }} strokeWidth={2} aria-hidden />
                {copied ? shareUi.copied : shareUi.copyLink}
              </button>
              <button
                type="button"
                className={styles.shareOption}
                onClick={() => openShareTarget(`https://wa.me/?text=${shareTextEncoded}%20${shareUrlEncoded}`)}
              >
                <MessageCircle className={styles.shareOptionIcon} style={{ color: '#25d366' }} strokeWidth={2} aria-hidden />
                {shareUi.whatsapp}
              </button>
              <a
                className={styles.shareOption}
                href={`mailto:?subject=${shareTextEncoded}&body=${shareUrlEncoded}`}
              >
                <Mail className={styles.shareOptionIcon} style={{ color: 'var(--primary, #2168b8)' }} strokeWidth={2} aria-hidden />
                {shareUi.email}
              </a>
              <button
                type="button"
                className={styles.shareOption}
                onClick={() => openShareTarget(`https://t.me/share/url?url=${shareUrlEncoded}&text=${shareTextEncoded}`)}
              >
                <span className={styles.shareOptionIconBadge} style={{ background: '#229ed9' }}>
                  <Send className={styles.shareOptionIcon} strokeWidth={2} fill="currentColor" aria-hidden />
                </span>
                {shareUi.telegram}
              </button>
              <button
                type="button"
                className={styles.shareOption}
                onClick={() => openShareTarget(`https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`)}
              >
                <span className={styles.shareOptionIconBadge} style={{ background: '#1877f2' }}>
                  <Facebook className={styles.shareOptionIcon} strokeWidth={2} fill="currentColor" aria-hidden />
                </span>
                {shareUi.facebook}
              </button>
              <button
                type="button"
                className={styles.shareOption}
                onClick={() => openShareTarget(`https://twitter.com/intent/tweet?url=${shareUrlEncoded}&text=${shareTextEncoded}`)}
              >
                <Twitter className={styles.shareOptionIcon} style={{ color: 'var(--secondary, #131719)' }} strokeWidth={2} aria-hidden />
                {shareUi.x}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && images[lightboxIndex]?.src && (
        <div
          className={styles.lightboxOverlay}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={tourUi.photoGridLightboxAria}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className={styles.lightboxClose}
            aria-label={tourUi.photoGridClose}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              fill
              className={styles.lightboxImage}
              sizes="(max-width: 768px) 100vw, min(2560px, 96vw)"
              priority
              {...SANITY_DISPLAY_IMAGE_PROPS}
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                aria-label={tourUi.photoGridPrev}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextImage}
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                aria-label={tourUi.photoGridNext}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}

          <div className={styles.lightboxCounter}>
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
