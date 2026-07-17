export type ManifestClassId = 'eco' | 'premium' | 'first'

export interface ManifestManualEntry {
  id: string
  date: string
  classId: ManifestClassId
  className: string
  adult: number
  child: number
  infant: number
  firstName: string
  lastName: string
  seatLabel: string
  createdAt: string
}

export interface ManifestPrintRow {
  id: string
  source: 'booking' | 'manual'
  date: string
  classId: string
  className: string
  firstName: string
  lastName: string
  adult: number
  child: number
  infant: number
  seatLabel: string
  tourTitle?: string
  totalPrice?: number
  paidNow?: number
  remainingAmount?: number
  currency?: string
}

export const MANIFEST_CLASS_OPTIONS: { id: ManifestClassId; label: string }[] = [
  { id: 'eco', label: 'Ekonomi' },
  { id: 'premium', label: 'Premium' },
  { id: 'first', label: 'First Class' },
]
