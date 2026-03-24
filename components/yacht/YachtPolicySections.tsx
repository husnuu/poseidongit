import type { ReactNode } from 'react'
import { PortableText } from '@portabletext/react'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtPolicySections.module.css'

function CheckLine({ children }: { children: ReactNode }) {
  return (
    <li className={styles.checkItem}>
      <span className={styles.checkMark} aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4.5 4L19 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  )
}

export default function YachtPolicySections({ yacht }: { yacht: YachtRentalDocument }) {
  const cancel = yacht.cancellationPaymentPolicies
  const cancelUrl = yacht.cancellationCheckPriceUrl?.trim()
  const cancelLinkLabel = yacht.cancellationCheckPriceLabel?.trim() || 'Fiyatı kontrol edin'
  const licence = yacht.sailingLicenceRequired?.trim()
  const pets = yacht.petsPolicy?.trim()
  const methods = yacht.paymentMethodsAccepted?.filter((m) => m?.trim()) ?? []
  const marina = yacht.marinaInformation

  const blocks: { key: string; title: string; body: ReactNode }[] = []

  if (cancel?.length) {
    blocks.push({
      key: 'cancel',
      title: 'İptal / ödeme politikaları',
      body: (
        <div className={styles.rich}>
          <PortableText value={cancel} />
          {cancelUrl ? (
            <p className={styles.linkWrap}>
              <a href={cancelUrl} className={styles.inlineLink} target="_blank" rel="noopener noreferrer">
                {cancelLinkLabel}
              </a>
            </p>
          ) : null}
        </div>
      ),
    })
  }

  if (licence) {
    blocks.push({
      key: 'licence',
      title: 'Gerekli belge / ehliyet',
      body: <p className={styles.plain}>{licence}</p>,
    })
  }

  if (pets) {
    blocks.push({
      key: 'pets',
      title: 'Evcil hayvanlar',
      body: <p className={styles.plain}>{pets}</p>,
    })
  }

  if (methods.length > 0) {
    blocks.push({
      key: 'pay',
      title: 'Charter şirketinin kabul ettiği ödeme yöntemleri',
      body: (
        <ul className={styles.checkList}>
          {methods.map((m) => (
            <CheckLine key={m}>{m}</CheckLine>
          ))}
        </ul>
      ),
    })
  }

  if (marina?.length) {
    blocks.push({
      key: 'marina',
      title: 'Marina hakkında',
      body: (
        <div className={styles.rich}>
          <PortableText value={marina} />
        </div>
      ),
    })
  }

  if (blocks.length === 0) return null

  return (
    <div className={styles.wrap}>
      {blocks.map((row) => (
        <section key={row.key} className={styles.row} aria-labelledby={`yp-${row.key}`}>
          <h2 id={`yp-${row.key}`} className={`${headingStyles.h2} ${styles.rowTitle}`}>
            {row.title}
          </h2>
          <div className={styles.rowBody}>{row.body}</div>
        </section>
      ))}
    </div>
  )
}
