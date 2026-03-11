import { jsonLdScript } from '@/lib/seo'

type Props = { data: Record<string, unknown> }

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  )
}
