import type { ReactNode } from 'react'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock, PortableTextSpan } from '@portabletext/types'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtPolicySections.module.css'

/**
 * Politika metinleri Sanity'de gerçek madde listesi olarak değil, paragrafın
 * başına elle "• " yazılarak girilmiş — bu yüzden varsayılan render'da asılı
 * girinti (hanging indent) olmadan, ikinci satır madde işaretinin hizasına
 * geri dönüyordu. Burada bu paragrafları tespit edip düzgün bir madde satırına
 * (renkli nokta + girintili metin) çeviriyoruz — Sanity içeriğine dokunmadan.
 */
function getPlainText(block: PortableTextBlock): string {
  return (block.children ?? [])
    .map((c) => (typeof (c as { text?: unknown }).text === 'string' ? (c as { text: string }).text : ''))
    .join('')
}

/** PortableText'in kendi <p> sarmalayıcısını iptal eder — <p> sarmalamayı biz yapıyoruz. */
const inlineBlockComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <>{children}</>,
  },
}

function RichPolicyText({ blocks }: { blocks: PortableTextBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        const raw = getPlainText(block)
        const bulletMatch = /^[•\-]\s+/.exec(raw)
        if (!bulletMatch) {
          return (
            <p key={i}>
              <PortableText value={[block]} components={inlineBlockComponents} />
            </p>
          )
        }
        const strippedLen = bulletMatch[0].length
        const children = [...(block.children ?? [])]
        const first = children[0] as PortableTextSpan | undefined
        if (first && typeof first.text === 'string') {
          children[0] = { ...first, text: first.text.slice(strippedLen) } satisfies PortableTextSpan
        }
        const strippedBlock = { ...block, children } as PortableTextBlock
        return (
          <p key={i} className={styles.bulletParagraph}>
            <span className={styles.bulletDot} aria-hidden />
            <span>
              <PortableText value={[strippedBlock]} components={inlineBlockComponents} />
            </span>
          </p>
        )
      })}
    </>
  )
}

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

export default function YachtPolicySections({
  yacht,
  locale = 'tr',
}: {
  yacht: YachtRentalDocument
  locale?: SiteLocale
}) {
  const ui = getYachtUi(locale)
  const cancel = yacht.cancellationPaymentPolicies
  const cancelUrl = yacht.cancellationCheckPriceUrl?.trim()
  const cancelLinkLabel = yacht.cancellationCheckPriceLabel?.trim() || ui.policyCancelCheckPriceDefault
  const licence = yacht.sailingLicenceRequired?.trim()
  const pets = yacht.petsPolicy?.trim()
  const methods = yacht.paymentMethodsAccepted?.filter((m) => m?.trim()) ?? []
  const marina = yacht.marinaInformation

  const blocks: { key: string; title: string; body: ReactNode }[] = []

  if (cancel?.length) {
    blocks.push({
      key: 'cancel',
      title: ui.policyCancelTitle,
      body: (
        <div className={styles.rich}>
          <RichPolicyText blocks={cancel} />
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
      title: ui.policyLicenceTitle,
      body: <p className={styles.plain}>{licence}</p>,
    })
  }

  if (pets) {
    blocks.push({
      key: 'pets',
      title: ui.policyPetsTitle,
      body: <p className={styles.plain}>{pets}</p>,
    })
  }

  if (methods.length > 0) {
    blocks.push({
      key: 'pay',
      title: ui.policyPaymentMethodsTitle,
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
      title: ui.policyMarinaTitle,
      body: (
        <div className={styles.rich}>
          <RichPolicyText blocks={marina} />
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
