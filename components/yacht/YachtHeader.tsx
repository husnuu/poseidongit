import { Info, MapPin } from 'lucide-react'
import { yachtTypeLabel } from '@/lib/yachtTypes'
import YachtTypeGlyph from '@/components/yacht/YachtTypeGlyph'
import styles from './YachtHeader.module.css'

interface YachtHeaderProps {
  name: string
  yachtType?: string | null
  locationTitle?: string | null
  marina?: string | null
}

export default function YachtHeader({
  name,
  yachtType,
  locationTitle,
  marina,
}: YachtHeaderProps) {
  const typeLabel = yachtTypeLabel(yachtType)
  const typeUpper = typeLabel.toLocaleUpperCase('tr-TR')
  /** EVİTA: önce liman / marina, yoksa bölge */
  const locPrimary = marina?.trim() || locationTitle?.trim() || ''
  const locDisplay = locPrimary ? locPrimary.toLocaleUpperCase('tr-TR') : ''
  const locTooltip = [locationTitle, marina].filter((s) => s?.trim()).join(' · ') || undefined
  const showLocInfo = Boolean(locTooltip?.includes(' · '))

  const titleDisplay = name.trim().toLocaleUpperCase('tr-TR')

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
                aria-label={`Konum: ${locTooltip}`}
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
