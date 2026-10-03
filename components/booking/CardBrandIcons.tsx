'use client'

import type { CardBrand } from '@/lib/nestpayCardFields'

/**
 * Kart numarası alanının sağına konan marka ikon şeridi.
 * Türkiye'deki müşteri kitlesine uygun olarak Visa / Mastercard / Troy gösterilir
 * (referans görseldeki Discover yerine, yerel kart şeması Troy kullanıldı).
 * `activeBrand` girilen numarayla eşleşince o ikon öne çıkar, diğerleri soluklaşır;
 * hiçbiri girilmemişken (activeBrand null) hepsi normal renkte durur.
 */

const ICON_BOX = { width: 28, height: 18, radius: 3 }

function IconFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={ICON_BOX.width}
      height={ICON_BOX.height}
      viewBox={`0 0 ${ICON_BOX.width} ${ICON_BOX.height}`}
      aria-hidden
    >
      <rect
        x={0.5}
        y={0.5}
        width={ICON_BOX.width - 1}
        height={ICON_BOX.height - 1}
        rx={ICON_BOX.radius}
        fill="#fff"
        stroke="#e2e8f0"
      />
      {children}
    </svg>
  )
}

function VisaMark() {
  return (
    <IconFrame>
      <text
        x={ICON_BOX.width / 2}
        y={13}
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize={9}
        fontWeight={900}
        fontStyle="italic"
        fill="#1434CB"
        letterSpacing={-0.3}
      >
        VISA
      </text>
    </IconFrame>
  )
}

function MastercardMark() {
  return (
    <IconFrame>
      <circle cx={11.5} cy={9} r={5.2} fill="#EB001B" />
      <circle cx={16.5} cy={9} r={5.2} fill="#F79E1B" fillOpacity={0.9} />
    </IconFrame>
  )
}

function TroyMark() {
  return (
    <IconFrame>
      <text
        x={ICON_BOX.width / 2}
        y={12.5}
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize={8.5}
        fontWeight={800}
        fill="#A1122E"
      >
        troy
      </text>
    </IconFrame>
  )
}

function UnionPayMark() {
  return (
    <IconFrame>
      <rect x={2} y={4} width={7.3} height={10} rx={1} fill="#E21836" />
      <rect x={10.3} y={4} width={7.3} height={10} fill="#00447C" />
      <rect x={18.6} y={4} width={7.4} height={10} rx={1} fill="#007B37" />
    </IconFrame>
  )
}

const STRIP_BRANDS: { key: CardBrand; Icon: () => React.JSX.Element }[] = [
  { key: 'visa', Icon: VisaMark },
  { key: 'mastercard', Icon: MastercardMark },
  { key: 'troy', Icon: TroyMark },
  { key: 'unionpay', Icon: UnionPayMark },
]

export function CardBrandIconStrip({ activeBrand }: { activeBrand: CardBrand | null }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {STRIP_BRANDS.map(({ key, Icon }) => {
        const dim = activeBrand != null && activeBrand !== key
        return (
          <span
            key={key}
            style={{
              opacity: dim ? 0.3 : 1,
              filter: dim ? 'grayscale(1)' : 'none',
              transition: 'opacity .15s ease, filter .15s ease',
              display: 'inline-flex',
            }}
          >
            <Icon />
          </span>
        )
      })}
    </div>
  )
}

/**
 * Güvenlik kodu alanının yanına konan ipucu ikonu: arkası dönük kart üzerinde
 * imza şeridi ve "123" — kullanıcıya CVC'nin kartın arkasında olduğunu anımsatır.
 */
export function CvvHintIcon() {
  return (
    <svg width={30} height={20} viewBox="0 0 30 20" aria-hidden>
      <rect x={0.75} y={0.75} width={28.5} height={18.5} rx={3} fill="#fff" stroke="#cbd5e1" />
      <rect x={0.75} y={4.5} width={28.5} height={4} fill="#334155" />
      <rect x={4} y={11} width={19} height={4.5} rx={0.5} fill="#e2e8f0" />
      <text
        x={25.5}
        y={14.5}
        textAnchor="end"
        fontFamily="Arial, sans-serif"
        fontSize={5.5}
        fontWeight={700}
        fill="#334155"
      >
        123
      </text>
    </svg>
  )
}
