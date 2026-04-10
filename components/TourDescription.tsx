import TourDescriptionExpandable from './TourDescriptionExpandable'
import type { PortableTextBlock } from '@portabletext/react'
import type { SiteLocale } from '@/lib/i18n/config'

interface TourDescriptionProps {
  description?: PortableTextBlock[] | null
  locale: SiteLocale
}

export default function TourDescription({ description, locale }: TourDescriptionProps) {
  if (!description) return null

  return <TourDescriptionExpandable description={description} locale={locale} />
}
