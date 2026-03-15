import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const SANITY_FETCH_TIMEOUT_MS = 15_000

function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), SANITY_FETCH_TIMEOUT_MS)
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  )
}

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7q8277he',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_API_READ_TOKEN || undefined,
  fetch: fetchWithTimeout,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}
