import React from 'react'
import { useFormValue, StringInputProps } from 'sanity'
import { Box, Text, Code } from '@sanity/ui'

/**
 * Tur belgesinin _id ve slug değerini salt okunur gösterir.
 * Rezervasyon / availability API'de kullanılan ID = _id ?? slug
 */
export function TourIdField(props: StringInputProps) {
  const document = useFormValue([]) as { _id?: string; slug?: { current?: string } } | undefined
  const id = document?._id ?? '—'
  const slug = document?.slug?.current ?? '—'
  const usedForApi = id && id !== '—' ? id : slug

  return (
    <Box padding={3} style={{ border: '1px solid var(--card-border-color)', borderRadius: 6 }}>
      <Text size={1} weight="semibold" style={{ marginBottom: 8, display: 'block' }}>
        Tur ID (Rezervasyon)
      </Text>
      <Code size={1} style={{ display: 'block', marginBottom: 6 }}>
        Document _id: {id}
      </Code>
      <Code size={1} style={{ display: 'block', marginBottom: 6 }}>
        Slug: {slug}
      </Code>
      <Text size={0} muted>
        API ve rezervasyonlarda kullanılan: <strong>{usedForApi}</strong>
      </Text>
    </Box>
  )
}
