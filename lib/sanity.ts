import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7q8277he',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_API_READ_TOKEN || undefined,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}

/** `urlFor` geçersiz veya eksik asset ile patlayabilir; RSC’de 500 önlemek için. */
export function safeSanityImageUrl(
  source: Parameters<typeof builder.image>[0] | null | undefined,
  pipe?: (b: ReturnType<typeof builder.image>) => ReturnType<typeof builder.image>,
): string | null {
  if (source == null) return null
  try {
    let b = builder.image(source)
    if (pipe) b = pipe(b)
    const u = b.url()
    return u?.trim() ? u : null
  } catch {
    return null
  }
}
