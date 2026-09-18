/** Kalkış saatinden `minutesBefore` dakika önceki saati döner (biniş başlangıcı / en geç biniş için). */
export function timeMinutesBefore(time: string | undefined, minutesBefore: number): string | undefined {
  if (!time?.trim()) return undefined
  const m = time.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return undefined
  let h = parseInt(m[1], 10)
  let min = parseInt(m[2], 10) - minutesBefore
  while (min < 0) {
    min += 60
    h -= 1
  }
  if (h < 0) h += 24
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}
