import type { SVGProps } from 'react'

/** Beyaz çizgili Google “G”; Tabler Icons (MIT) brand-google outline uyarlması */
export default function GoogleModern(props: SVGProps<SVGSVGElement>) {
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
      <path
        d="M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
