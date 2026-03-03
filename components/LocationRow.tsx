import styles from './LocationRow.module.css'

interface LocationRowProps {
  meetingLocation?: string | null
  fallbackLabel?: string | null
}

export default function LocationRow({
  meetingLocation,
  fallbackLabel,
}: LocationRowProps) {
  const label = meetingLocation || fallbackLabel
  if (!label) return null

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    label
  )}`

  return (
    <a
      className={styles.row}
      href={mapsHref}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.icon} aria-hidden>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 22C12 22 19 16.5 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 16.5 12 22 12 22ZM12 12.5C13.3807 12.5 14.5 11.3807 14.5 10C14.5 8.61929 13.3807 7.5 12 7.5C10.6193 7.5 9.5 8.61929 9.5 10C9.5 11.3807 10.6193 12.5 12 12.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className={styles.text}>{label}</span>
    </a>
  )
}
