'use client'

import Link from 'next/link'
import { Ticket, CheckCircle2 } from 'lucide-react'
import { ticketPagePath } from '@/lib/siteUrls'
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
}

function formatSummaryDate(d: string): string {
  const s = (d ?? '').trim()
  if (!s) return '—'
  try {
    const raw = /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s
    const x = new Date(raw)
    if (Number.isNaN(x.getTime())) return s
    return x.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return s
  }
}

const PUBLIC_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim()
const PUBLIC_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()

export default function PaymentSuccessPanel({
  bookingId,
  accessToken,
  summary,
  doneButtonLabel,
  onDone,
}: PaymentSuccessPanelProps) {
  const dateLabel = formatSummaryDate(summary.date)
  const totalStr = `${summary.totalPrice.toLocaleString('tr-TR')} ${summary.currency}`

  return (
    <>
      <div className={styles.paymentSuccessHeader}>
        <div className={styles.paymentSuccessIconWrap} aria-hidden>
          <CheckCircle2 className={styles.paymentSuccessIcon} strokeWidth={2.4} />
        </div>
        <h2 className={styles.paymentSuccessTitle}>Rezervasyonunuz onaylandı</h2>
        <p className={styles.paymentSuccessLead}>
          Rezervasyon özetiniz ve e-biletiniz e-posta adresinize gönderilmiştir. Sorularınız için{' '}
          <Link href="/contact" className={styles.paymentSuccessInlineLink}>
            iletişim sayfamızdaki
          </Link>{' '}
          numaralardan
          {PUBLIC_PHONE ? (
            <>
              {' '}
              (
              <a href={`tel:${PUBLIC_PHONE.replace(/\s/g, '')}`} className={styles.paymentSuccessInlineLink}>
                {PUBLIC_PHONE}
              </a>
              )
            </>
          ) : null}
          {' '}
          veya{` `}
          {PUBLIC_EMAIL ? (
            <a href={`mailto:${PUBLIC_EMAIL}`} className={styles.paymentSuccessInlineLink}>
              {PUBLIC_EMAIL}
            </a>
          ) : (
            'e-posta'
          )}
          {PUBLIC_EMAIL ? ' adresinden' : ' ile'} bize ulaşabilirsiniz.
        </p>
      </div>

      <div className={styles.paymentSuccessRefCard}>
        <div className={styles.paymentSuccessRefLabel}>Rezervasyon no</div>
        <div className={styles.paymentSuccessRefId}>{bookingId}</div>
      </div>

      <div className={styles.paymentSuccessSheet} role="list">
        <div className={styles.paymentSuccessSheetRow} role="listitem">
          <span className={styles.paymentSuccessSheetLabel}>Tur</span>
          <span className={styles.paymentSuccessSheetValue}>{summary.tourTitle}</span>
        </div>
        <div className={styles.paymentSuccessSheetRow} role="listitem">
          <span className={styles.paymentSuccessSheetLabel}>Tarih</span>
          <span className={styles.paymentSuccessSheetValue}>{dateLabel}</span>
        </div>
        <div className={styles.paymentSuccessSheetRow} role="listitem">
          <span className={styles.paymentSuccessSheetLabel}>Sınıf</span>
          <span className={styles.paymentSuccessSheetValue}>{summary.className}</span>
        </div>
        <div
          className={`${styles.paymentSuccessSheetRow} ${styles.paymentSuccessSheetRowTotal}`}
          role="listitem"
        >
          <span className={styles.paymentSuccessSheetLabel}>Toplam</span>
          <span className={styles.paymentSuccessSheetValue}>{totalStr}</span>
        </div>
      </div>

      <p className={styles.paymentSuccessFootnote}>
        Biletinizi aşağıdan anında görüntüleyebilir veya e-postanızdaki PDF ekinde saklayabilirsiniz.
      </p>

      {accessToken ? (
        <a
          href={ticketPagePath(bookingId, accessToken)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ticketPdfBtn}
          style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Ticket className="w-5 h-5" aria-hidden />
          Biletimi Görüntüle
        </a>
      ) : (
        <p className={styles.successText} style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
          Biletinizi görmek için{' '}
          <a
            href={`/rezervasyon/yonet?bookingId=${encodeURIComponent(bookingId)}`}
            style={{ color: '#1f3c88', fontWeight: 600 }}
          >
            Rezervasyonumu Yönet
          </a>{' '}
          sayfasına gidip e-postanızı girin.
        </p>
      )}

      <button type="button" className={styles.ctaButton} onClick={onDone} style={{ display: 'block', width: '100%', textAlign: 'center' }}>
        {doneButtonLabel}
      </button>
    </>
  )
}
