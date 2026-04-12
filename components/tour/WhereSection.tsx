'use client'

/** Toplanma noktası ikonu – düz, renksiz (currentColor) */
function MeetingPointIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      width={20}
      height={19}
      className={className}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M19.064 34.898h-2.129v-3.482c-6.554-.522-11.793-5.835-12.259-12.453H1v-2.13h3.692c.559-6.523 5.756-11.732 12.243-12.25v-3.48h2.129v3.482c6.555.523 11.793 5.834 12.26 12.453H35v2.13h-3.693c-.558 6.524-5.755 11.731-12.243 12.25v3.481zM18 6.671C11.808 6.67 6.772 11.753 6.772 18S11.808 29.33 18 29.33 29.228 24.247 29.228 18 24.192 6.67 18 6.67z"
      />
      <circle cx="18" cy="18" r="4.5" fill="currentColor" />
    </svg>
  )
}

export type WhereSectionData = {
  enabled?: boolean | null
  heading?: string | null
  meetingPointLabel?: string | null
  meetingPointAddress?: string | null
  mapEmbedUrl?: string | null
  /** Sanity: Paylaş → Bağlantıyı kopyala (CMS alanı; harita iframe’i ayrı). */
  locationMapLink?: string | null
  openInMapsLabel?: string | null
}

type WhereSectionProps = {
  data: WhereSectionData | null | undefined
  /** CMS başlığı yokken (örn. locale). */
  headingFallback?: string
}

export default function WhereSection({
  data,
  headingFallback = 'Nerede',
}: WhereSectionProps) {
  if (!data?.enabled) return null
  if (!data.mapEmbedUrl && !(data.meetingPointLabel || data.meetingPointAddress)) return null

  return (
    <section className="mb-8" aria-labelledby="where-section-heading">
      <h2
        id="where-section-heading"
        className="text-2xl font-bold mb-4"
        style={{ color: '#1e3a5f' }}
      >
        {data.heading || headingFallback}
      </h2>

      {(data.meetingPointLabel || data.meetingPointAddress) && (
        <div className="flex gap-3 items-start mb-4">
          <span
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ color: '#334155' }}
            aria-hidden
          >
            <MeetingPointIcon className="w-5 h-[19px]" />
          </span>
          <div className="min-w-0 flex-1">
            {data.meetingPointLabel && (
              <span
                className="font-semibold block mb-1"
                style={{ color: '#0f172a' }}
              >
                {data.meetingPointLabel}
              </span>
            )}
            {data.meetingPointAddress && (
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: '#1e293b' }}
              >
                {data.meetingPointAddress}
              </p>
            )}
          </div>
        </div>
      )}

      {data.mapEmbedUrl && (
        <div className="relative w-full rounded-xl overflow-hidden bg-zinc-200 h-[220px]">
          <iframe
            src={data.mapEmbedUrl}
            title="Harita"
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </section>
  )
}
