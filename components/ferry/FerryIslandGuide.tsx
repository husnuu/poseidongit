import type { CSSProperties } from 'react'
import Image from 'next/image'
import type { SiteLocale } from '@/lib/i18n/config'
import { getFerryPageUiStrings } from '@/lib/i18n/strings/ferryPage'
import { ISLAND_PHOTOS, type IslandGuideText, type IslandPhotoKey } from '@/lib/ferry/islandGuides'

const SECTION_TITLE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-family-title, var(--font-family))',
  WebkitTextStroke: '0.4px currentColor',
  color: 'var(--secondary, #131719)',
}

const SUBTITLE_CLASS = 'm-0 mb-3 text-[15px] font-extrabold uppercase tracking-wide text-[#131719]'

type FerryIslandGuideProps = {
  guide: IslandGuideText
  /** Sayfada kullanılan tüm ada fotoğrafları (galeri dahil) — lisans gereği kaynak satırında listelenir. */
  creditPhotos: IslandPhotoKey[]
  locale: SiteLocale
}

/** Feribot hattı sayfası: varış adası hakkında kısa rehber (gezilecek yerler, plajlar, pratik bilgiler). */
export default function FerryIslandGuide({ guide, creditPhotos, locale }: FerryIslandGuideProps) {
  const ui = getFerryPageUiStrings(locale)
  const photoCards = guide.mustSee.filter((item) => item.photo)
  const otherPlaces = guide.mustSee.filter((item) => !item.photo)
  const credits = Array.from(new Set(creditPhotos)).map((key) => ({ key, photo: ISLAND_PHOTOS[key] }))

  return (
    <section className="mb-10" aria-labelledby="ferry-island-heading">
      <h2 id="ferry-island-heading" className="m-0 mb-4 text-[19px] font-extrabold uppercase leading-[1.25]" style={SECTION_TITLE_STYLE}>
        {guide.heading}
      </h2>
      <div className="space-y-4 text-[15.5px] leading-relaxed text-[#3f3f46]" style={{ fontFamily: 'var(--font-family)' }}>
        {guide.intro.map((paragraph, i) => (
          <p key={i} className="m-0">
            {paragraph}
          </p>
        ))}
      </div>

      <h3 className={`${SUBTITLE_CLASS} mt-8`}>{ui.islandMustSee}</h3>
      {photoCards.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-3">
          {photoCards.map((item) => {
            const photo = ISLAND_PHOTOS[item.photo!]
            return (
              <li key={item.name} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="relative aspect-[4/3] w-full bg-zinc-100">
                  <Image
                    src={photo.src}
                    alt={photo.caption[locale]}
                    fill
                    quality={85}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 300px"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="m-0 text-[15px] font-bold leading-snug text-[#0f172a]">{item.name}</p>
                  <p className="m-0 mt-1.5 text-[14px] leading-relaxed text-[#475569]">{item.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {otherPlaces.length > 0 && (
        <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-x-8 gap-y-3 p-0 sm:grid-cols-2">
          {otherPlaces.map((item) => (
            <li key={item.name} className="text-[14.5px] leading-relaxed text-[#475569]">
              <span className="font-bold text-[#0f172a]">{item.name}:</span> {item.text}
            </li>
          ))}
        </ul>
      )}

      <h3 className={`${SUBTITLE_CLASS} mt-8`}>{ui.islandBeaches}</h3>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {guide.beaches.map((beach) => (
          <li key={beach.name} className="rounded-xl border border-zinc-200 p-4">
            <p className="m-0 text-[15px] font-bold text-[#131719]">{beach.name}</p>
            <p className="m-0 mt-1 text-[14px] leading-relaxed text-[#52525b]">{beach.text}</p>
          </li>
        ))}
      </ul>

      <h3 className={`${SUBTITLE_CLASS} mt-8`}>{ui.islandPractical}</h3>
      <dl className="m-0 space-y-3">
        {guide.practical.map((item) => (
          <div key={item.title} className="text-[14.5px] leading-relaxed">
            <dt className="font-bold text-[#131719]">{item.title}</dt>
            <dd className="m-0 text-[#52525b]">{item.text}</dd>
          </div>
        ))}
      </dl>

      {credits.length > 0 && (
        <p className="mt-8 text-[11.5px] leading-relaxed text-[#94a3b8]">
          {ui.photoCredits}:{' '}
          {credits.map(({ key, photo }, i) => (
            <span key={key}>
              {photo.caption[locale]} —{' '}
              <a href={photo.credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-[#64748b]">
                {photo.credit.author}
              </a>{' '}
              (
              <a href={photo.credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline decoration-dotted underline-offset-2 hover:text-[#64748b]">
                {photo.credit.license}
              </a>
              ){i < credits.length - 1 ? ' · ' : ', Wikimedia Commons'}
            </span>
          ))}
        </p>
      )}
    </section>
  )
}
