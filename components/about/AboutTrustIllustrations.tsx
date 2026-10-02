/** Hakkımızda güven rozeti şeridi için düz vektör ("flat illustration") tarzı
    simgeler — jenerik ikon+gradyan rozet yerine, referans görsellerdeki gibi
    birkaç sade şekilden oluşan, köşelerinde küçük parıltı ("sparkle")
    aksanları olan, tek bir ailede tasarlanmış üç çizim. */

interface IllustrationProps {
  className?: string
}

/** Dört köşeli "parıltı" şekli — referans görsellerdeki dekoratif yıldızlarla aynı dil. */
function Sparkle({
  cx,
  cy,
  r,
  fill,
  opacity = 1,
}: {
  cx: number
  cy: number
  r: number
  fill: string
  opacity?: number
}) {
  const d = [
    `M ${cx} ${cy - r}`,
    `C ${cx + r * 0.15} ${cy - r * 0.15} ${cx + r * 0.85} ${cy - r * 0.15} ${cx + r} ${cy}`,
    `C ${cx + r * 0.15} ${cy + r * 0.15} ${cx + r * 0.15} ${cy + r * 0.85} ${cx} ${cy + r}`,
    `C ${cx - r * 0.15} ${cy + r * 0.15} ${cx - r * 0.85} ${cy + r * 0.15} ${cx - r} ${cy}`,
    `C ${cx - r * 0.15} ${cy - r * 0.15} ${cx - r * 0.15} ${cy - r * 0.85} ${cx} ${cy - r}`,
    'Z',
  ].join(' ')
  return <path d={d} fill={fill} opacity={opacity} />
}

/** "Yıllık Deneyim" — çapa. */
export function ExperienceIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="58" r="46" fill="#eef3f8" />
      <ellipse cx="60" cy="104" rx="26" ry="5" fill="#13171912" />
      <g stroke="#3b5a73" strokeWidth="5" strokeLinecap="round" fill="none">
        <circle cx="60" cy="30" r="7" />
        <line x1="60" y1="37" x2="60" y2="82" />
        <line x1="47" y1="46" x2="73" y2="46" />
        <path d="M38 60 C38 76 49 87 58 90" />
        <path d="M82 60 C82 76 71 87 62 90" />
      </g>
      <circle cx="38" cy="60" r="4.5" fill="#3b5a73" />
      <circle cx="82" cy="60" r="4.5" fill="#3b5a73" />
      <Sparkle cx={91} cy={27} r={9} fill="#f5a623" />
      <Sparkle cx={25} cy={85} r={7} fill="#fc6c4f" />
      <Sparkle cx={28} cy={28} r={5} fill="#f5a623" opacity={0.65} />
    </svg>
  )
}

/** "Farklı Teknede Hizmet" — yelkenli. */
export function FleetIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="58" r="46" fill="#fdf3e7" />
      <ellipse cx="62" cy="100" rx="30" ry="5" fill="#13171912" />
      <path
        d="M18 85 Q28 79 38 85 T58 85 T78 85 T98 85"
        stroke="#9cc6e3"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="60" y1="78" x2="60" y2="29" stroke="#8a6b3f" strokeWidth="3" strokeLinecap="round" />
      <path d="M61 33 L61 76 L89 76 Z" fill="#bfe0f2" stroke="#8fc1e0" strokeWidth="2" strokeLinejoin="round" />
      <path d="M59 41 L59 76 L37 76 Z" fill="#ffffff" stroke="#dbe7ee" strokeWidth="2" strokeLinejoin="round" />
      <path d="M60 29 L73 34 L60 39 Z" fill="#fc6c4f" />
      <path d="M32 78 L88 78 L77 93 L43 93 Z" fill="#e3bd82" stroke="#c89b5c" strokeWidth="2" strokeLinejoin="round" />
      <Sparkle cx={93} cy={33} r={8} fill="#f5a623" />
      <Sparkle cx={23} cy={45} r={6} fill="#fc6c4f" opacity={0.8} />
      <Sparkle cx={95} cy={60} r={5} fill="#f5a623" opacity={0.6} />
    </svg>
  )
}

/** "Misafir Yorumu" — madalyon/yıldız. */
export function RatingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="58" r="46" fill="#fff6e6" />
      <ellipse cx="60" cy="104" rx="24" ry="5" fill="#13171912" />
      <path d="M48 72 L37 101 L50 93 Z" fill="#e85c4a" />
      <path d="M72 72 L83 101 L70 93 Z" fill="#fc6c4f" />
      <circle cx="60" cy="56" r="28" fill="#f5a623" stroke="#d98c1f" strokeWidth="3" />
      <circle cx="60" cy="56" r="21" fill="#ffd27a" />
      <path
        d="M60 42 L64.5 52.5 L76 53.5 L67 61 L70 72 L60 65.5 L50 72 L53 61 L44 53.5 L55.5 52.5 Z"
        fill="#ffffff"
      />
      <Sparkle cx={93} cy={29} r={8} fill="#f5a623" />
      <Sparkle cx={24} cy={36} r={6} fill="#fc6c4f" opacity={0.85} />
      <Sparkle cx={30} cy={90} r={5} fill="#f5a623" opacity={0.55} />
    </svg>
  )
}
