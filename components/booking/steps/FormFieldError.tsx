'use client'

import styles from '../booking.module.css'

export default function FormFieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className={styles.formFieldError} role="alert">
      <span className={styles.formFieldErrorIcon} aria-hidden>
        !
      </span>
      <span>{message}</span>
    </p>
  )
}
