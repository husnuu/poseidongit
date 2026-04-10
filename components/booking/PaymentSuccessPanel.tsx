'use client'

import Link from 'next/link'
import { Ticket, CheckCircle2 } from 'lucide-react'
import { ticketPagePath } from '@/lib/siteUrls'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from './booking.module.css'

export type PaymentSuccessSummary = {
  tourTitle: string
  date: string
  className: string
  totalPrice: number
  currency: string
}

export type PaymentSuccessPanelProps = {
  bookingId: string
  accessToken?: string
  summary: PaymentSuccessSummary
  doneButtonLabel: string
  onDone: () => void
  locale?: SiteLocale
}

function formatSummaryDate(d: string, numberLocale: string): string {
  const s = (d ?? '').trim()
  if (!s) return '—'
  try {
    const raw = /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s
    const x = new Date(raw)
    if (Number.isNaN(x.getTime())) return s
    return x.toLocaleDateString(numberLocale, { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return s
  }
}

const PUBLIC_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim()
const PUBLIC_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()

function SuccessLead({
  locale,
  contactHref,
  linkClass,
}: {
  locale: SiteLocale
  contactHref: string
  linkClass: string
}) {
  if (locale === 'tr') {
    return (
      <p className={styles.paymentSuccessLead}>
        Rezervasyon özetiniz ve e-biletiniz e-posta adresinize gönderilmiştir. Sorularınız için{' '}
        <Link href={contactHref} className={linkClass}>
          iletişim sayfamızdaki
        </Link>{' '}
        numaralardan
        {PUBLIC_PHONE ? (
          <>
            {' '}
            (
            <a href={`tel:${PUBLIC_PHONE.replace(/\s/g, '')}`} className={linkClass}>
              {PUBLIC_PHONE}
            </a>
            )
          </>
        ) : null}
        {' '}
        veya{` `}
        {PUBLIC_EMAIL ? (
          <a href={`mailto:${PUBLIC_EMAIL}`} className={linkClass}>
            {PUBLIC_EMAIL}
          </a>
        ) : (
          'e-posta'
        )}
        {PUBLIC_EMAIL ? ' adresinden' : ' ile'} bize ulaşabilirsiniz.
      </p>
    )
  }

  if (locale === 'de') {
    return (
      <p className={styles.paymentSuccessLead}>
        Ihre Buchungsübersicht und Ihr E-Ticket wurden an Ihre E-Mail-Adresse gesendet. Bei Fragen besuchen Sie unsere{' '}
        <Link href={contactHref} className={linkClass}>
          Kontaktseite
        </Link>
        {PUBLIC_PHONE ? (
          <>
            , rufen Sie uns an (
            <a href={`tel:${PUBLIC_PHONE.replace(/\s/g, '')}`} className={linkClass}>
              {PUBLIC_PHONE}
            </a>
            )
          </>
        ) : null}
        {PUBLIC_EMAIL ? (
          <>
            {' '}
            oder schreiben Sie an{' '}
            <a href={`mailto:${PUBLIC_EMAIL}`} className={linkClass}>
              {PUBLIC_EMAIL}
            </a>
          </>
        ) : null}
        .
      </p>
    )
  }

  return (
    <p className={styles.paymentSuccessLead}>
      Your booking summary and e-ticket have been sent to your email. If you have questions, visit our{' '}
      <Link href={contactHref} className={linkClass}>
        contact page
      </Link>
      {PUBLIC_PHONE ? (
        <>
          , call{' '}
          <a href={`tel:${PUBLIC_PHONE.replace(/\s/g, '')}`} className={linkClass}>
            {PUBLIC_PHONE}
          </a>
        </>
      ) : null}
      {PUBLIC_EMAIL ? (
        <>
          , or email{' '}
          <a href={`mailto:${PUBLIC_EMAIL}`} className={linkClass}>
            {PUBLIC_EMAIL}
          </a>
        </>
      ) : null}
      .
    </p>
  )
}

export default function PaymentSuccessPanel({
  bookingId,
  accessToken,
  summary,
  doneButtonLabel,
  onDone,
  locale = 'tr',
}: PaymentSuccessPanelProps) {
  const ui = getBookingWizardUi(locale)
  const contactHref = withLocalePath(locale, '/contact')
  const dateLabel = formatSummaryDate(summary.date, ui.numberLocale)
  const totalStr = `${summary.totalPrice.toLocaleString(ui.numberLocale)} ${summary.currency}`
  const ticketHref = withLocalePath(locale, ticketPagePath(bookingId, accessToken))
  const manageHref = withLocalePath(
    locale,
    `/rezervasyon/yonet?bookingId=${encodeURIComponent(bookingId)}`
  )

  return (
    <>
      <div className={styles.paymentSuccessHeader}>
        <div className={styles.paymentSuccessIconWrap} aria-hidden>
          <CheckCircle2 className={styles.paymentSuccessIcon} strokeWidth={2.4} />
        </div>
        <h2 className={styles.paymentSuccessTitle}>{ui.paymentSuccessTitle}</h2>
        <SuccessLead locale={locale} contactHref={contactHref} linkClass={styles.paymentSuccessInlineLink} />
      </div>

      <div className={styles.paymentSuccessRefCard}>
        <div className={styles.paymentSuccessRefLabel}>{ui.refLabel}</div>
        <div className={styles.paymentSuccessRefId}>{bookingId}</div>
      </div>

      <div className={styles.paymentSuccessSheet} role="list">
        <div className={styles.paymentSuccessSheetRow} role="listitem">
          <span className={styles.paymentSuccessSheetLabel}>{ui.sheetTour}</span>
          <span className={styles.paymentSuccessSheetValue}>{summary.tourTitle}</span>
        </div>
        <div className={styles.paymentSuccessSheetRow} role="listitem">
          <span className={styles.paymentSuccessSheetLabel}>{ui.sheetDate}</span>
          <span className={styles.paymentSuccessSheetValue}>{dateLabel}</span>
        </div>
        <div className={styles.paymentSuccessSheetRow} role="listitem">
          <span className={styles.paymentSuccessSheetLabel}>{ui.sheetClass}</span>
          <span className={styles.paymentSuccessSheetValue}>{summary.className}</span>
        </div>
        <div
          className={`${styles.paymentSuccessSheetRow} ${styles.paymentSuccessSheetRowTotal}`}
          role="listitem"
        >
          <span className={styles.paymentSuccessSheetLabel}>{ui.sheetTotal}</span>
          <span className={styles.paymentSuccessSheetValue}>{totalStr}</span>
        </div>
      </div>

      <p className={styles.paymentSuccessFootnote}>{ui.ticketFootnote}</p>

      {accessToken ? (
        <a
          href={ticketHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ticketPdfBtn}
          style={{
            marginBottom: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <Ticket className="w-5 h-5" aria-hidden />
          {ui.viewTicket}
        </a>
      ) : (
        <p className={styles.successText} style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
          {ui.manageBookingHintBefore}
          <a href={manageHref} style={{ color: '#1f3c88', fontWeight: 600 }}>
            {ui.manageBookingLink}
          </a>
          {ui.manageBookingHintAfter}
        </p>
      )}

      <button
        type="button"
        className={styles.ctaButton}
        onClick={onDone}
        style={{ display: 'block', width: '100%', textAlign: 'center' }}
      >
        {doneButtonLabel}
      </button>
    </>
  )
}
