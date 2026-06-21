import Image from 'next/image'
import { CalendarDays, MapPin, Sailboat } from 'lucide-react'
import YachtTypeGlyph from '@/components/yacht/YachtTypeGlyph'
import type { YachtDepositCharterConfig } from '@/lib/yachtDepositCharter'
import type { SiteLocale } from '@/lib/i18n/config'
import styles from './YachtDepositCharterSummary.module.css'

const LABELS: Record<
  SiteLocale,
  { yacht: string; dates: string; depositFor: string }
> = {
  tr: {
    yacht: 'Kapora teknesi',
    dates: 'Kiralama tarihi',
    depositFor: 'Bu kapora aşağıdaki tekne ve tarih için alınır',
  },
  en: {
    yacht: 'Yacht for this deposit',
    dates: 'Charter dates',
    depositFor: 'This deposit applies to the yacht and dates below',
  },
  de: {
    yacht: 'Yacht für diese Anzahlung',
    dates: 'Charterdatum',
    depositFor: 'Diese Anzahlung gilt für die unten genannte Yacht und Termine',
  },
}

interface YachtDepositCharterSummaryProps {
  config: YachtDepositCharterConfig
  locale: SiteLocale
  compact?: boolean
}

export default function YachtDepositCharterSummary({
  config,
  locale,
  compact = false,
}: YachtDepositCharterSummaryProps) {
  const t = LABELS[locale] ?? LABELS.tr

  return (
    <section
      className={`${styles.wrap} ${compact ? styles.wrapCompact : ''}`}
      aria-label={t.depositFor}
    >
      {!compact ? (
        <p className={styles.lead}>{t.depositFor}</p>
      ) : null}

      <div className={styles.card}>
        {config.coverImageUrl ? (
          <div className={styles.imageWrap}>
            <Image
              src={config.coverImageUrl}
              alt={config.coverImageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        ) : (
          <div className={`${styles.imageWrap} ${styles.imagePlaceholder}`} aria-hidden>
            <Sailboat className={styles.placeholderIcon} strokeWidth={1.5} />
          </div>
        )}

        <div className={styles.body}>
          <p className={styles.eyebrow}>{t.yacht}</p>
          <h2 className={styles.yachtName}>{config.yachtName}</h2>

          <div className={styles.metaRow}>
            <span className={styles.metaPill}>
              <YachtTypeGlyph yachtType={config.yachtType} className={styles.metaGlyph} />
              {config.yachtTypeLabel}
            </span>
            {config.locationLabel ? (
              <span className={styles.metaPill}>
                <MapPin className={styles.metaPin} strokeWidth={2} aria-hidden />
                {config.locationLabel}
              </span>
            ) : null}
          </div>

          {config.specLine ? <p className={styles.specLine}>{config.specLine}</p> : null}

          <div className={styles.dateBlock}>
            <CalendarDays className={styles.dateIcon} strokeWidth={2} aria-hidden />
            <div>
              <p className={styles.dateLabel}>{t.dates}</p>
              <p className={styles.dateValue}>{config.dateSummary}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
