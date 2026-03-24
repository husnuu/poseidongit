import { ScrollText } from 'lucide-react'
import TourDescriptionExpandable from '@/components/TourDescriptionExpandable'
import type { PortableTextBlock } from '@portabletext/react'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'

interface YachtDescriptionProps {
  description?: PortableTextBlock[] | null
}

export default function YachtDescription({ description }: YachtDescriptionProps) {
  if (!description?.length) return null
  return (
    <TourDescriptionExpandable
      description={description}
      heading="Açıklama"
      headingVariant="yacht"
      headingClassName={headingStyles.h2}
      headingIcon={<ScrollText className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />}
    />
  )
}
