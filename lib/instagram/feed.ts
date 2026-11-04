import { unstable_cache } from 'next/cache'

/**
 * Instagram akışı — resmi "Instagram API with Instagram Login" (graph.instagram.com).
 * Kurulum: docs/INSTAGRAM_KURULUM.md. Token yoksa veya API hata verirse null döner,
 * ana sayfa Sanity'deki gönderilere düşer.
 *
 * Uzun ömürlü token 60 gün geçerlidir. Token 7 günden eskiyse burada yenilenir ve
 * Supabase'deki integration_tokens tablosuna yazılır; böylece ortam değişkeni bir
 * kez girildikten sonra elle yenileme gerekmez.
 */

const GRAPH = 'https://graph.instagram.com'
const API = `${GRAPH}/v21.0`
const TOKEN_KEY = 'instagram'
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000
const MAX_POSTS = 12

export type InstagramProfile = {
  username: string
  name: string | null
  profilePictureUrl: string | null
  followersCount: number | null
}

export type InstagramFeedPost = {
  id: string
  imageUrl: string
  permalink: string
  caption: string | null
  isVideo: boolean
}

export type InstagramFeed = { profile: InstagramProfile; posts: InstagramFeedPost[] }

type StoredToken = { token: string; refreshedAt: number }

async function readStoredToken(): Promise<StoredToken | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase
      .from('integration_tokens')
      .select('token, refreshed_at')
      .eq('key', TOKEN_KEY)
      .maybeSingle()
    if (!data?.token) return null
    return { token: String(data.token), refreshedAt: new Date(String(data.refreshed_at)).getTime() || 0 }
  } catch {
    return null
  }
}

async function refreshAndStore(token: string): Promise<string> {
  try {
    const res = await fetch(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`)
    if (!res.ok) return token
    const fresh = (await res.json())?.access_token
    if (typeof fresh !== 'string' || !fresh) return token
    const { supabase } = await import('@/lib/supabase')
    await supabase
      .from('integration_tokens')
      .upsert({ key: TOKEN_KEY, token: fresh, refreshed_at: new Date().toISOString() }, { onConflict: 'key' })
    return fresh
  } catch {
    return token
  }
}

async function resolveToken(): Promise<string | null> {
  const stored = await readStoredToken()
  const token = stored?.token || process.env.INSTAGRAM_ACCESS_TOKEN?.trim()
  if (!token) return null
  // Env'den ilk kez geliyorsa ya da yenileme zamanı geldiyse yenile + sakla.
  if (!stored || Date.now() - stored.refreshedAt > REFRESH_AFTER_MS) return refreshAndStore(token)
  return token
}

async function graphGet<T>(path: string, token: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API}${path}${sep}access_token=${encodeURIComponent(token)}`)
  if (!res.ok) throw new Error(`Instagram API HTTP ${res.status}`)
  return (await res.json()) as T
}

type MediaRow = {
  id: string
  caption?: string
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink?: string
}

async function loadFeed(): Promise<InstagramFeed | null> {
  try {
    const token = await resolveToken()
    if (!token) return null
    const [me, media] = await Promise.all([
      graphGet<{ username?: string; name?: string; profile_picture_url?: string; followers_count?: number }>(
        '/me?fields=username,name,profile_picture_url,followers_count',
        token
      ),
      graphGet<{ data?: MediaRow[] }>(
        `/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=${MAX_POSTS}`,
        token
      ),
    ])
    if (!me.username) return null
    const posts = (media.data ?? [])
      .map((m) => ({
        id: m.id,
        imageUrl: (m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url) ?? '',
        permalink: m.permalink ?? `https://www.instagram.com/${me.username}/`,
        caption: m.caption?.trim() || null,
        isVideo: m.media_type === 'VIDEO',
      }))
      .filter((p) => p.imageUrl)
    return {
      profile: {
        username: me.username,
        name: me.name?.trim() || null,
        profilePictureUrl: me.profile_picture_url ?? null,
        followersCount: typeof me.followers_count === 'number' ? me.followers_count : null,
      },
      posts,
    }
  } catch (e) {
    console.warn('[instagram] akış alınamadı, Sanity gönderileri kullanılacak:', e instanceof Error ? e.message : e)
    return null
  }
}

/** Saatte bir yenilenir (Instagram görsel adresleri imzalı ve süreli olduğu için daha uzun tutulmaz). */
export const getInstagramFeed = unstable_cache(loadFeed, ['instagram-feed-v1'], {
  revalidate: 3600,
  tags: ['instagram'],
})
