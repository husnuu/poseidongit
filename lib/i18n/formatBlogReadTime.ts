/** Okuma süresi: önce sayı + dil eki, yoksa eski string alan. */
export function formatBlogReadTime(
  row: { readingTime?: number | null; readTime?: string | null },
  suffix: string,
): string | undefined {
  if (typeof row.readingTime === 'number' && Number.isFinite(row.readingTime) && row.readingTime > 0) {
    return `${row.readingTime} ${suffix}`
  }
  const legacy = row.readTime
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim()
  return undefined
}
