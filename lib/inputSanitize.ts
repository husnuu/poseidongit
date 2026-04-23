/**
 * Kullanıcı metinleri için hafif temizlik: açı HTML benzeri parçaları kaldırır,
 * kontrol karakterlerini budar, uzunluk sınırlar.
 * XSS’i önlemek için tek başına yeterli değildir; çıktıda React kaçışı / escapeHtml ile birlikte düşünülmelidir.
 */

const CTRL_EXCEPT_NEWLINE_TAB = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

/** `<...>` bloklarını kaldırır (iç içe ve eksik `>` için güvenli tarama). */
export function stripAngleBracketTags(input: string): string {
  let s = String(input ?? '')
  let out = ''
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === '<') {
      const close = s.indexOf('>', i + 1)
      if (close === -1) {
        i += 1
        continue
      }
      i = close + 1
      continue
    }
    out += ch
    i += 1
  }
  return out
}

function stripControls(s: string, multiline: boolean): string {
  if (multiline) {
    return s.replace(CTRL_EXCEPT_NEWLINE_TAB, '')
  }
  return s.replace(/[\x00-\x1F\x7F]/g, '')
}

/** Tek satır: boşlukları sadeleştirir, newline’ları boşluğa çevirir. */
export function sanitizeSingleLineText(raw: string, maxLen: number): string {
  let s = stripAngleBracketTags(String(raw ?? ''))
  s = stripControls(s, false)
  s = s.replace(/\s+/g, ' ').trim()
  return s.slice(0, maxLen)
}

/** Not / mesaj: satır sonlarını korur, fazla boşlukları sadeleştirir. */
export function sanitizeMultilineText(raw: string, maxLen: number): string {
  let s = stripAngleBracketTags(String(raw ?? ''))
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  s = stripControls(s, true)
  const lines = s.split('\n').map((line) => line.replace(/[ \t]+/g, ' ').trim())
  s = lines.join('\n').trim()
  return s.slice(0, maxLen)
}

export function sanitizePersonName(raw: string, maxLen = 80): string {
  return sanitizeSingleLineText(raw, maxLen)
}

export function sanitizePhoneDisplay(raw: string, maxLen = 48): string {
  return sanitizeSingleLineText(raw, maxLen)
}

export function sanitizeTourSlugOrId(raw: string, maxLen = 200): string {
  return sanitizeSingleLineText(raw, maxLen)
}

export function sanitizeTourTitleText(raw: string, maxLen = 300): string {
  return sanitizeSingleLineText(raw, maxLen)
}

export function sanitizeMeetingPointText(raw: string, maxLen = 500): string {
  return sanitizeSingleLineText(raw, maxLen)
}

export function sanitizeCustomerNote(raw: string | undefined, maxLen = 2000): string | undefined {
  if (raw == null) return undefined
  const s = sanitizeMultilineText(raw, maxLen)
  return s.length > 0 ? s : undefined
}

export function sanitizeAdminNote(raw: string | undefined, maxLen = 4000): string | undefined {
  if (raw == null) return undefined
  const s = sanitizeMultilineText(raw, maxLen)
  return s.length > 0 ? s : undefined
}
