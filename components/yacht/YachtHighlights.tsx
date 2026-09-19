import type { LucideIcon } from 'lucide-react'
import {
  Anchor,
  Bath,
  BedDouble,
  Calendar,
  Cog,
  Info,
  MapPin,
  Ruler,
  Users,
} from 'lucide-react'
import type { YachtSpecifications, YachtTechnicalRow } from '@/lib/yachtTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtHighlights.module.css'

interface Row {
  label: string
  value: string
  iconKey: string
}

function RowIcon({ iconKey }: { iconKey: string }) {
  const ICONS: Record<string, LucideIcon> = {
    buildYear: Calendar,
    capacity: Users,
    cabins: BedDouble,
    wc: Bath,
    length: Ruler,
    crew: Anchor,
    engine: Cog,
    departure: MapPin,
  }
  const Icon = ICONS[iconKey] ?? Info
  return <Icon className={styles.rowIcon} strokeWidth={2} aria-hidden />
}

function specRows(
  spec: YachtSpecifications | null | undefined,
  ui: ReturnType<typeof getYachtUi>
): Row[] {
  if (!spec) return []
  const out: Row[] = []
  if (spec.buildYear != null) out.push({ label: ui.specBuildYear, value: String(spec.buildYear), iconKey: 'buildYear' })
  if (spec.capacity != null) out.push({ label: ui.specCapacity, value: `${spec.capacity} ${ui.personSuffix}`, iconKey: 'capacity' })
  if (spec.cabins != null) out.push({ label: ui.specCabins, value: String(spec.cabins), iconKey: 'cabins' })
  if (spec.wc?.trim()) out.push({ label: ui.specWc, value: spec.wc.trim(), iconKey: 'wc' })
  if (spec.length?.trim()) out.push({ label: ui.specLength, value: spec.length.trim(), iconKey: 'length' })
  if (spec.crew?.trim()) out.push({ label: ui.specCrew, value: spec.crew.trim(), iconKey: 'crew' })
  if (spec.engine?.trim()) out.push({ label: ui.specEngine, value: spec.engine.trim(), iconKey: 'engine' })
  return out
}

function techRows(rows?: YachtTechnicalRow[]): Row[] {
  if (!rows?.length) return []
  return rows
    .filter((r) => r.label?.trim() && r.value?.trim())
    .map((r) => ({ label: r.label!.trim(), value: r.value!.trim(), iconKey: '' }))
}

interface YachtHighlightsProps {
  specifications?: YachtSpecifications | null
  departurePoint?: string | null
  technicalSpecs?: YachtTechnicalRow[]
  locale?: SiteLocale
}

export default function YachtHighlights({
  specifications,
  departurePoint,
  technicalSpecs,
  locale = 'tr',
}: YachtHighlightsProps) {
  const ui = getYachtUi(locale)
  const primary = specRows(specifications, ui)
  if (departurePoint?.trim()) {
    primary.push({ label: ui.specDeparture, value: departurePoint.trim(), iconKey: 'departure' })
  }
  const extra = techRows(technicalSpecs)
  const all = [...primary, ...extra]
  if (all.length === 0) return null

  const renderItem = (row: Row, idx: number) => {
    return (
      <li
        key={`${row.label}-${row.value}-${idx}`}
        className={styles.item}
      >
        <div className={styles.itemTop}>
          <RowIcon iconKey={row.iconKey} />
          <span className={styles.label}>{row.label}</span>
        </div>
        <span className={styles.value}>{row.value}</span>
      </li>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="yacht-highlights-heading">
      <h2 id="yacht-highlights-heading" className={`${headingStyles.h2} ${styles.highlightsHeading}`}>
        {ui.highlightsHeading}
      </h2>
      <ul className={styles.flatGrid}>
        {all.map((row, i) => renderItem(row, i))}
      </ul>
    </section>
  )
}
