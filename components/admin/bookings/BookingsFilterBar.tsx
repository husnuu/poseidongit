'use client'

import type { BookingStatus, TourOption } from '@/types/adminBookings'
import { MANUAL_SOURCE_LABELS } from '@/types/adminBookings'

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'web', label: MANUAL_SOURCE_LABELS.web },
  { value: 'manual', label: MANUAL_SOURCE_LABELS.manual },
  { value: 'physical', label: MANUAL_SOURCE_LABELS.physical },
  { value: 'phone', label: MANUAL_SOURCE_LABELS.phone },
  { value: 'whatsapp', label: MANUAL_SOURCE_LABELS.whatsapp },
  { value: 'agency', label: MANUAL_SOURCE_LABELS.agency },
]

interface BookingsFilterBarProps {
  dateFrom: string
  dateTo: string
  tourId: string
  classFilter: string
  statusFilter: BookingStatus | ''
  sourceFilter: string
  searchQuery: string
  uniqueClassNames: string[]
  tours: TourOption[]
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  onTourIdChange: (v: string) => void
  onClassFilterChange: (v: string) => void
  onStatusFilterChange: (v: BookingStatus | '') => void
  onSourceFilterChange: (v: string) => void
  onSearchQueryChange: (v: string) => void
  onExportPdf: () => void
  onExportCsv: () => void
  pdfExporting: boolean
  csvExporting: boolean
  exportDisabled: boolean
  onLogout: () => void
}

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'paid', label: 'Ödendi' },
  { value: 'failed', label: 'Ödeme başarısız' },
  { value: 'cancelled', label: 'İptal' },
]

const INPUT_CLASS =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-[#131719] placeholder:text-zinc-400 focus:border-[#2168b8] focus:outline-none'
const LABEL_CLASS = 'text-sm font-bold text-zinc-500'

export default function BookingsFilterBar({
  dateFrom,
  dateTo,
  tourId,
  classFilter,
  statusFilter,
  sourceFilter,
  searchQuery,
  uniqueClassNames,
  tours,
  onDateFromChange,
  onDateToChange,
  onTourIdChange,
  onClassFilterChange,
  onStatusFilterChange,
  onSourceFilterChange,
  onSearchQueryChange,
  onExportPdf,
  onExportCsv,
  pdfExporting,
  csvExporting,
  exportDisabled,
  onLogout,
}: BookingsFilterBarProps) {
  return (
    <div className="rounded-2xl border border-[#f1f5f9] bg-white p-3 shadow-[0_2px_8px_rgba(19,23,25,0.06)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:w-auto sm:min-w-0">
          <label className={`sr-only sm:not-sr-only sm:mb-1 sm:block ${LABEL_CLASS}`}>Arama</label>
          <input
            type="search"
            placeholder="Müşteri, telefon, tur adı..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className={`${INPUT_CLASS} sm:min-w-[200px]`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className={LABEL_CLASS}>Tarih</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className={`min-w-0 flex-1 sm:flex-none ${INPUT_CLASS}`}
              />
              <span className="text-zinc-400">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className={`min-w-0 flex-1 sm:flex-none ${INPUT_CLASS}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className={LABEL_CLASS}>Tur</label>
            <select
              value={tourId}
              onChange={(e) => onTourIdChange(e.target.value)}
              className={`${INPUT_CLASS} sm:min-w-[140px]`}
            >
              <option value="">Tümü</option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className={LABEL_CLASS}>Sınıf</label>
            <select
              value={classFilter}
              onChange={(e) => onClassFilterChange(e.target.value)}
              className={`${INPUT_CLASS} sm:min-w-[100px]`}
            >
              <option value="">Tümü</option>
              {uniqueClassNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className={LABEL_CLASS}>Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as BookingStatus | '')}
              className={`${INPUT_CLASS} sm:min-w-[100px]`}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className={LABEL_CLASS}>Kaynak</label>
            <select
              value={sourceFilter}
              onChange={(e) => onSourceFilterChange(e.target.value)}
              className={`${INPUT_CLASS} sm:min-w-[110px]`}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[#f1f5f9] pt-3 sm:ml-auto sm:border-0 sm:pt-0">
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportDisabled || pdfExporting}
            className="min-h-[44px] rounded-xl bg-[#2168b8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b5697] disabled:opacity-50"
          >
            {pdfExporting ? 'PDF…' : 'PDF'}
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            disabled={exportDisabled || csvExporting}
            className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-[#131719] hover:bg-zinc-50 disabled:opacity-50"
          >
            {csvExporting ? 'CSV…' : 'CSV'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-50"
          >
            Çıkış
          </button>
        </div>
      </div>
    </div>
  )
}
