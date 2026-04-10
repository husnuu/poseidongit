import Link from 'next/link'
import faqStyles from '@/components/FAQAccordion.module.css'

type Props = {
  whatsappHref?: string | null
  className?: string
  heading: string
  description: string
  whatsappCta: string
  whatsappUnavailable: string
  contactLabel: string
  contactHref: string
}

const interBoldCta = {
  fontFamily: '"Inter-Bold", var(--font-family), sans-serif',
  fontWeight: 700 as const,
  fontSize: '17px',
  textTransform: 'uppercase' as const,
}

export default function HelpSupportCTA({
  whatsappHref,
  className = '',
  heading,
  description,
  whatsappCta,
  whatsappUnavailable,
  contactLabel,
  contactHref,
}: Props) {
  return (
    <aside
      className={`border-t border-zinc-200/80 pt-10 ${className}`}
      aria-labelledby="help-support-cta-heading"
    >
      <h2
        id="help-support-cta-heading"
        className="text-lg font-black uppercase leading-snug tracking-wide sm:text-xl"
        style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: '#1e3a5f' }}
      >
        {heading}
      </h2>
      <p
        className="mt-2 max-w-xl text-base leading-6"
        style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--secondary, #131719)' }}
      >
        {description}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {whatsappHref ? (
          <Link
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={faqStyles.missingQuestionCta}
          >
            {whatsappCta}
          </Link>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted, #81848b)' }}>
            {whatsappUnavailable}
          </p>
        )}
        <Link
          href={contactHref}
          className="hero-btn-shine hero-cta-secondary inline-flex h-12 w-full flex-shrink-0 items-center justify-center rounded px-6 text-[#1e3a5f] no-underline transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-2 focus:ring-offset-zinc-50 sm:h-12 sm:w-[196px]"
          style={interBoldCta}
        >
          {contactLabel}
        </Link>
      </div>
    </aside>
  )
}
