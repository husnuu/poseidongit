import { Info, MapPin } from 'lucide-react'
import { yachtTypeLabel } from '@/lib/yachtTypes'
import YachtTypeGlyph from '@/components/yacht/YachtTypeGlyph'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import styles from './YachtHeader.module.css'

interface YachtHeaderProps {
  name: string
  yachtType?: string | null
  locationTitle?: string | null
  marina?: string | null
  locale?: SiteLocale
}

export default function YachtHeader({
  name,
  yachtType,
  locationTitle,
  marina,
  locale = 'tr',
}: YachtHeaderProps) {
  const ui = getYachtUi(locale)
  const typeLabel = yachtTypeLabel(yachtType, locale)
  const typeUpper = typeLabel.toLocaleUpperCase(ui.dateLocale)
  /** EVİTA: önce liman / marina, yoksa bölge */
  const locPrimary = marina?.trim() || locationTitle?.trim() || ''
  const locDisplay = locPrimary ? locPrimary.toLocaleUpperCase(ui.dateLocale) : ''
  const locTooltip = [locationTitle, marina].filter((s) => s?.trim()).join(' · ') || undefined
  const showLocInfo = Boolean(locTooltip?.includes(' · '))

  const titleDisplay = name.trim().toLocaleUpperCase(ui.dateLocale)

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{titleDisplay}</h1>

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <YachtTypeGlyph yachtType={yachtType} className={styles.metaGlyph} />
          <span className={styles.metaText}>{typeUpper}</span>
        </span>
        {locDisplay ? (
          <span className={styles.metaItem}>
            <MapPin className={styles.metaPin} strokeWidth={2} aria-hidden />
            <span className={styles.metaText}>{locDisplay}</span>
            {locTooltip && showLocInfo ? (
              <span
                className={styles.infoWrap}
                title={locTooltip}
                tabIndex={0}
                role="img"
                aria-label={ui.locationInfoAria(locTooltip)}
              >
                <Info className={styles.infoIcon} strokeWidth={2} aria-hidden />
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </header>
  )
}
