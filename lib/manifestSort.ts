/** Çıktı listesi satırlarını soyad → ad (tr-TR A–Z) sıralar. */
export function sortManifestRowsAlphabetically<
  T extends { firstName: string; lastName: string },
>(rows: T[]): T[] {
  const key = (row: T) => {
    const last = row.lastName.trim().toLocaleLowerCase('tr-TR')
    const first = row.firstName.trim().toLocaleLowerCase('tr-TR')
    return `${last}\0${first}`
  }
  return [...rows].sort((a, b) => key(a).localeCompare(key(b), 'tr-TR', { sensitivity: 'base' }))
}
