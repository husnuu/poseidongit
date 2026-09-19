import { ScrollText } from 'lucide-react'
import TourDescriptionExpandable from '@/components/TourDescriptionExpandable'
import type { PortableTextBlock } from '@portabletext/react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'

interface YachtDescriptionProps {
  description?: PortableTextBlock[] | null
  locale?: SiteLocale
}

export default function YachtDescription({ description, locale = 'tr' }: YachtDescriptionProps) {
  if (!description?.length) return null
  const ui = getYachtUi(locale)
  return (
    <TourDescriptionExpandable
      description={description}
      heading={ui.descriptionHeading}
      headingVariant="yacht"
      headingClassName={headingStyles.h2}
      headingIcon={<ScrollText className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />}
    />
  )
}
