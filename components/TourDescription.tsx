import TourDescriptionExpandable from './TourDescriptionExpandable'
import type { PortableTextBlock } from '@portabletext/react'

interface TourDescriptionProps {
  description?: PortableTextBlock[] | null
}

export default function TourDescription({
  description,
}: TourDescriptionProps) {
  if (!description) return null

  return <TourDescriptionExpandable description={description} />
}
