'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { PHONE_COUNTRY_CODES } from '@/lib/phoneCountryCodes'
import styles from './booking.module.css'

interface PhoneCountryCodeSelectProps {
  value: string
  onChange: (code: string) => void
  id?: string
  'aria-label'?: string
}

export default function PhoneCountryCodeSelect({
  value,
  onChange,
  id,
  'aria-label': ariaLabel,
}: PhoneCountryCodeSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selected = PHONE_COUNTRY_CODES.find((c) => c.code === value) ?? PHONE_COUNTRY_CODES[0]
  const displayCode = `+${selected.code}`

  return (
    <div ref={containerRef} className={styles.phoneCodeWrap} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel ?? 'Ülke kodu'}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.input}
        style={{
          width: 72,
          minHeight: 48,
          flexShrink: 0,
          cursor: 'pointer',
          paddingLeft: 0,
          paddingRight: 28,
          paddingTop: 12,
          paddingBottom: 12,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {displayCode}
        </span>
        <ChevronDown
          className={styles.phoneCodeChevron}
          size={16}
          style={{
            position: 'absolute',
            right: 8,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className={styles.phoneCodeDropdown}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            minWidth: 180,
            maxHeight: 260,
            overflowY: 'auto',
            listStyle: 'none',
            padding: 4,
            margin: 0,
            background: '#fff',
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 50,
          }}
        >
          {PHONE_COUNTRY_CODES.map(({ code, name }) => (
            <li key={`${code}-${name}`} role="option" aria-selected={code === value}>
              <button
                type="button"
                className={styles.phoneCodeOption}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  textAlign: 'left',
                  border: 'none',
                  borderRadius: 8,
                  background: code === value ? 'rgba(33, 104, 184, 0.1)' : 'transparent',
                  color: '#18181b',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onChange(code)
                  setOpen(false)
                }}
              >
                {name} +{code}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
