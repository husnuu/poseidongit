'use client'

import Image from 'next/image'

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export type TourListItem = {
  _id: string
  title: string | null
  slug: string | null
  shortDescription?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  departureLabel?: string | null
  durationLabel?: string | null
  rating?: number | null
  reviewCount?: number | null
  reviewsUrl?: string | null
  priceFrom?: number | null
  isPopular?: boolean | null
}

function formatPriceFrom(price: number | null | undefined): string {
  if (price == null) return ''
  return `${price} ₺`
}

function RatingDots({ value }: { value: number }) {
  const full = Math.min(5, Math.round(value))
  const empty = 5 - full
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`} className="h-2 w-2 rounded-full bg-emerald-500" />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`} className="h-2 w-2 rounded-full bg-black/15" />
      ))}
    </span>
  )
}

type TourCardProps = {
  tour: TourListItem
}

export default function TourCard({ tour }: TourCardProps) {
  const href = tour.slug ? `/tour/${tour.slug}` : null
  const rating = tour.rating ?? 0

  const content = (
    <>
        {/* Kapak görsel */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
          {tour.coverImageUrl ? (
            <Image
              src={tour.coverImageUrl}
              alt={tour.coverImageAlt || tour.title || 'Tur görseli'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
              Görsel yok
            </div>
          )}
          {/* Ribbon badge - sol üst, turuncu, kesik kuyruk */}
          {tour.isPopular && (
            <div
              className="absolute left-0 top-4 z-10 flex items-center pl-3 pr-6 py-1.5 text-white text-xs font-bold uppercase tracking-wide"
              style={{
                background: 'linear-gradient(90deg, #d8832a 0%, #c97622 100%)',
                clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              En Popüler
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-6 md:p-8">
          {/* Başlık */}
          <h3
            className="font-black text-xl md:text-2xl uppercase leading-tight line-clamp-2 mb-3"
            style={{ color: 'var(--secondary)', fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {tour.title}
          </h3>

          {/* Açıklama */}
          {tour.shortDescription && (
            <p className="text-base text-black/60 leading-relaxed line-clamp-3 mb-5">
              {tour.shortDescription}
            </p>
          )}

          {/* Meta: Kalkış, Süre, Değerlendirme (tur sayfası ikonları) */}
          <div className="space-y-3 mb-5">
            {tour.departureLabel && (
              <div className="flex items-center gap-3 text-base font-semibold text-black/80">
                <span className="flex-shrink-0 text-[var(--primary)]"><PinIcon className="size-5" /></span>
                <span>Kalkış: {tour.departureLabel}</span>
              </div>
            )}
            {tour.durationLabel && (
              <div className="flex items-center gap-3 text-base font-semibold text-black/80">
                <span className="flex-shrink-0 text-[var(--primary)]"><ClockIcon className="size-5" /></span>
                <span>Süre: {tour.durationLabel}</span>
              </div>
            )}
            {(rating > 0 || (tour.reviewCount != null && tour.reviewCount > 0)) && (
              <div className="flex items-center gap-3 text-base">
                <RatingDots value={rating} />
                {tour.reviewsUrl ? (
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(tour.reviewsUrl!, '_blank', 'noopener,noreferrer')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        window.open(tour.reviewsUrl!, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded"
                    title="Google yorumları"
                  >
                    <GoogleIcon />
                    <span>
                      {tour.reviewCount != null && tour.reviewCount > 0
                        ? `${tour.reviewCount} değerlendirme`
                        : rating > 0
                          ? `${rating} puan`
                          : ''}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold">
                    <GoogleIcon />
                    <span>
                      {tour.reviewCount != null && tour.reviewCount > 0
                        ? `${tour.reviewCount} değerlendirme`
                        : rating > 0
                          ? `${rating} puan`
                          : ''}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Fiyat */}
          {tour.priceFrom != null && (
            <p
              className="text-lg font-extrabold uppercase mt-auto mb-4"
              style={{ color: 'var(--secondary)' }}
            >
              Kişi başı {formatPriceFrom(tour.priceFrom)}’den
            </p>
          )}

          {/* CTA - lacivert (hero ile aynı), kenar parıltısı + üstte hafif parlama */}
          <span className="hero-primary-btn-wrap tour-card-cta-shimmer mt-auto w-full rounded-xl p-[2px] flex">
            <span
              className="hero-primary-inner hero-btn-shine w-full rounded-[10px] py-2.5 md:py-3 font-black uppercase text-white text-center text-base md:text-[17px] flex items-center justify-center overflow-hidden transition hover:brightness-110 ring-1 ring-inset ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(15,23,42,0.18)]"
              style={{
                background: 'linear-gradient(180deg, #3558b0 0%, #1e3a8a 42%, #172e6e 100%)',
              }}
            >
              Turu görüntüle
            </span>
          </span>
        </div>
    </>
  )

  const wrapperClassName = 'flex flex-col h-full block'
  return (
    <article className="h-full flex flex-col rounded-2xl overflow-hidden bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-black/5 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
      {href ? (
        <a href={href} className={wrapperClassName}>
          {content}
        </a>
      ) : (
        <div className={`${wrapperClassName} opacity-90`}>
          {content}
        </div>
      )}
    </article>
  )
}
