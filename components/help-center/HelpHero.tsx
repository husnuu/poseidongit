import Image from 'next/image'
import type { HelpCenterPageDoc } from '@/lib/sanity/types/helpCenter'

type Props = {
  title: string
  description?: string | null
  eyebrow?: string | null
  heroImage?: HelpCenterPageDoc['heroImage']
  children?: React.ReactNode
}

export default function HelpHero({ title, description, eyebrow, heroImage, children }: Props) {
  const imgUrl = heroImage?.url?.trim() || null
  const imgAlt = heroImage?.alt?.trim() || ''
  const lqip = heroImage?.metadata?.lqip

  return (
    <header
      className="relative overflow-hidden text-white rounded-b-[2rem] sm:rounded-b-[2.25rem]"
      style={{
        background: imgUrl ? undefined : 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 42%, #172554 100%)',
      }}
    >
      {imgUrl ? (
        <>
          <Image
            src={imgUrl}
            alt={imgAlt || title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            placeholder={lqip ? 'blur' : undefined}
            blurDataURL={lqip ?? undefined}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30"
            aria-hidden
          />
        </>
      ) : null}

      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: 'rgba(33, 104, 184, 0.22)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'rgba(30, 58, 138, 0.15)' }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pt-20">
        {eyebrow ? (
          <p className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="max-w-4xl text-balance text-[30px] font-black uppercase leading-[1.15] tracking-tight sm:text-[40px] md:text-[46px] lg:text-[50px]"
          style={{
            fontFamily: 'var(--font-family-title, var(--font-family))',
            fontWeight: 900,
            textShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
          }}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-white/88 md:text-lg md:leading-relaxed">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-9 sm:mt-11">{children}</div> : null}
      </div>
    </header>
  )
}
