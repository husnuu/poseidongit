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
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtHighlights.module.css'

interface Row {
  label: string
  value: string
}

const LABEL_ICONS: Record<string, LucideIcon> = {
  'Yapım yılı': Calendar,
  Kapasite: Users,
  Kabin: BedDouble,
  'WC / banyo': Bath,
  Uzunluk: Ruler,
  Mürettebat: Anchor,
  Motor: Cog,
  Kalkış: MapPin,
}

function RowIcon({ label }: { label: string }) {
  const Icon = LABEL_ICONS[label] ?? Info
  return <Icon className={styles.rowIcon} strokeWidth={2} aria-hidden />
}

function specRows(spec?: YachtSpecifications | null): Row[] {
  if (!spec) return []
  const out: Row[] = []
  if (spec.buildYear != null) out.push({ label: 'Yapım yılı', value: String(spec.buildYear) })
  if (spec.capacity != null) out.push({ label: 'Kapasite', value: `${spec.capacity} kişi` })
  if (spec.cabins != null) out.push({ label: 'Kabin', value: String(spec.cabins) })
  if (spec.wc?.trim()) out.push({ label: 'WC / banyo', value: spec.wc.trim() })
  if (spec.length?.trim()) out.push({ label: 'Uzunluk', value: spec.length.trim() })
  if (spec.crew?.trim()) out.push({ label: 'Mürettebat', value: spec.crew.trim() })
  if (spec.engine?.trim()) out.push({ label: 'Motor', value: spec.engine.trim() })
  return out
}

function techRows(rows?: YachtTechnicalRow[]): Row[] {
  if (!rows?.length) return []
  return rows
    .filter((r) => r.label?.trim() && r.value?.trim())
    .map((r) => ({ label: r.label!.trim(), value: r.value!.trim() }))
}

interface YachtHighlightsProps {
  specifications?: YachtSpecifications | null
  departurePoint?: string | null
  technicalSpecs?: YachtTechnicalRow[]
}

export default function YachtHighlights({
  specifications,
  departurePoint,
  technicalSpecs,
}: YachtHighlightsProps) {
  const primary = specRows(specifications)
  if (departurePoint?.trim()) {
    primary.push({ label: 'Kalkış', value: departurePoint.trim() })
  }
  const extra = techRows(technicalSpecs)
  const all = [...primary, ...extra]
  if (all.length === 0) return null

  const mid = Math.ceil(all.length / 2)
  const left = all.slice(0, mid)
  const right = all.slice(mid)

  const renderItem = (row: Row, idx: number, globalIndex: number) => {
    const prev = globalIndex > 0 ? all[globalIndex - 1] : null
    const mobileAfterWc = row.label === 'Uzunluk' && prev?.label === 'WC / banyo'
    return (
      <li
        key={`${row.label}-${row.value}-${idx}`}
        className={`${styles.item} ${mobileAfterWc ? styles.itemMobileAfterWc : ''}`}
      >
        <div className={styles.itemTop}>
          <RowIcon label={row.label} />
          <span className={styles.label}>{row.label}</span>
        </div>
        <span className={styles.value}>{row.value}</span>
      </li>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="yacht-highlights-heading">
      <h2 id="yacht-highlights-heading" className={`${headingStyles.h2} ${styles.highlightsHeading}`}>
        Öne çıkan bilgiler
      </h2>
      <div className={styles.flatGrid}>
        <ul className={styles.col}>{left.map((row, i) => renderItem(row, i, i))}</ul>
        <ul className={styles.col}>
          {right.map((row, i) => renderItem(row, i, left.length + i))}
        </ul>
      </div>
    </section>
  )
}
