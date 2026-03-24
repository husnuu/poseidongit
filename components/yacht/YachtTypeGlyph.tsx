import { Anchor, Sailboat, Ship } from 'lucide-react'

/** Gulet: çift direk + geniş gövde (yelkenli tek direkten ayrılır) */
function GuletGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 17.5h18l-1.8-2.8H4.8L3 17.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 9.2v7.5M16 9.2v7.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M8 9.5L5.8 13.2h4.4L8 9.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5L13.8 13.2h4.4L16 9.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface YachtTypeGlyphProps {
  yachtType?: string | null
  className?: string
}

function normalizeType(raw?: string | null): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
}

/** Yat tipine göre silüet (kart + detay); hepsi 24×24 viewBox — `className` ile boyut verin */
export default function YachtTypeGlyph({ yachtType, className }: YachtTypeGlyphProps) {
  const t = normalizeType(yachtType)

  if (t === 'gulet') {
    return <GuletGlyph className={className} />
  }
  if (t === 'motoryacht') {
    return <Ship className={className} strokeWidth={1.75} aria-hidden />
  }
  if (t === 'sailing' || t === 'catamaran') {
    return <Sailboat className={className} strokeWidth={1.75} aria-hidden />
  }
  return <Anchor className={className} strokeWidth={1.75} aria-hidden />
}
