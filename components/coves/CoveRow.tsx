export interface CoveRowProps {
  reverse: boolean
  title: string
  description?: string | null
  imageUrl: string | null
  alt?: string | null
  /** İleride tekrar detay sayfası açılırsa kullanılır; satır artık tıklanabilir değil. */
  slug?: string | null
  noImageLabel?: string
  detailHint?: string
}

export default function CoveRow({
  reverse,
  title,
  description,
  imageUrl,
  alt,
  slug: _slug,
  noImageLabel = 'Görsel yok',
  detailHint = 'Detay',
}: CoveRowProps) {
  const content = (
    <>
      <div
        className={`w-full h-[260px] md:h-[340px] lg:h-[380px] bg-neutral-200 overflow-hidden ${
          reverse ? 'md:order-2' : 'md:order-1'
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt ?? title}
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-neutral-300 flex items-center justify-center text-neutral-500 text-sm">
            {noImageLabel}
          </div>
        )}
      </div>
      <div
        className={`bg-[#f8fafc] flex flex-col items-center justify-center text-center px-8 py-10 min-h-[200px] md:min-h-[260px] ${
          reverse ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <h2
          className="text-base md:text-lg tracking-[0.2em] uppercase font-extrabold"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--primary, #2168b8)' }}
        >
          {title}
        </h2>
        <div
          className="mt-3 h-px w-16"
          style={{ background: 'rgba(var(--primary-rgb, 33, 104, 184), 0.3)' }}
          aria-hidden
        />
        {description?.trim() && (
          <p
            className="mt-4 text-sm md:text-base leading-relaxed max-w-md"
            style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color, #58595b)' }}
          >
            {description}
          </p>
        )}
        <span
          className="mt-6 inline-flex items-center gap-2 text-sm select-none"
          style={{ color: 'var(--primary, #2168b8)', fontFamily: 'var(--font-family)' }}
          aria-hidden
        >
          <span className="font-bold uppercase">{detailHint}</span>
          <span aria-hidden>→</span>
        </span>
      </div>
    </>
  )

  const wrapperClass =
    'grid grid-cols-1 md:grid-cols-2 gap-0 w-full overflow-hidden'

  return <div className={wrapperClass}>{content}</div>
}
