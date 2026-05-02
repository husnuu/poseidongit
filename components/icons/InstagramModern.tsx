import type { SVGProps } from 'react'

/** Footer / sosyal alanlar için güncel, ince çizgili Instagram ana hatları */
export default function InstagramModern(props: SVGProps<SVGSVGElement>) {
  const { className, 'aria-label': ariaLabel, ...rest } = props
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaLabel ? false : true}
      aria-label={ariaLabel}
      {...rest}
    >
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.35" cy="6.65" r="1.2" fill="currentColor" />
    </svg>
  )
}
