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
      className="relative overflow-hidden text-white"
      style={{
        background: imgUrl ? undefined : 'linear-gradient(135deg, #131719 0%, #1e3a5f 45%, #131719 100%)',
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/25"
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

      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/80">{eyebrow}</p>
        ) : null}
        <h1
          className="max-w-4xl text-balance text-[32px] font-black uppercase leading-[1.2] sm:text-[40px] md:text-[48px] lg:text-[52px]"
          style={{
            fontFamily: 'var(--font-family-title, var(--font-family))',
            fontWeight: 900,
            textShadow: '0 6px 12px rgba(0, 0, 0, 0.16)',
          }}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/85 md:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8 sm:mt-10">{children}</div> : null}
      </div>
    </header>
  )
}
