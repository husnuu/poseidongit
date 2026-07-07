import type { ManifestManualEntry } from '@/types/manifestPrint'

const STORAGE_KEY = 'poseidon_manifest_manual_v1'

function readAll(): ManifestManualEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as ManifestManualEntry[]) : []
  } catch {
    return []
  }
}

function writeAll(entries: ManifestManualEntry[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function listManifestManualEntries(date: string): ManifestManualEntry[] {
  return readAll()
    .filter((e) => e.date === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function addManifestManualEntry(
  entry: Omit<ManifestManualEntry, 'id' | 'createdAt'>
): ManifestManualEntry {
  const created: ManifestManualEntry = {
    ...entry,
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), created])
  return created
}

export function removeManifestManualEntry(id: string): void {
  writeAll(readAll().filter((e) => e.id !== id))
}

export function clearManifestManualEntriesForDate(date: string): void {
  writeAll(readAll().filter((e) => e.date !== date))
}
