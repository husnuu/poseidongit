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
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:w-auto sm:min-w-0">
          <label className="sr-only sm:not-sr-only sm:mb-1 sm:block sm:text-sm sm:font-medium sm:text-slate-600">Arama</label>
          <input
            type="search"
            placeholder="Müşteri, telefon, tur adı..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 sm:min-w-[200px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className="text-sm font-medium text-slate-600">Tarih</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 sm:flex-none"
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 sm:flex-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className="text-sm font-medium text-slate-600">Tur</label>
            <select
              value={tourId}
              onChange={(e) => onTourIdChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 sm:min-w-[140px]"
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
            <label className="text-sm font-medium text-slate-600">Sınıf</label>
            <select
              value={classFilter}
              onChange={(e) => onClassFilterChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 sm:min-w-[100px]"
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
            <label className="text-sm font-medium text-slate-600">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as BookingStatus | '')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 sm:min-w-[100px]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className="text-sm font-medium text-slate-600">Kaynak</label>
            <select
              value={sourceFilter}
              onChange={(e) => onSourceFilterChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 sm:min-w-[110px]"
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:ml-auto sm:border-0 sm:pt-0">
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportDisabled || pdfExporting}
            className="min-h-[44px] rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {pdfExporting ? 'PDF…' : 'PDF'}
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            disabled={exportDisabled || csvExporting}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {csvExporting ? 'CSV…' : 'CSV'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Çıkış
          </button>
        </div>
      </div>
    </div>
  )
}
