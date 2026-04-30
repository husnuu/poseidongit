import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()

function resolveServerSupabaseKey(): string {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (serviceRole) return serviceRole

  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Production server code must use the service role key; do not fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (anon) return anon

  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY (required in production) or NEXT_PUBLIC_SUPABASE_ANON_KEY (optional fallback for local development only).'
  )
}

const supabaseServiceKey = resolveServerSupabaseKey()

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

/**
 * Server-side singleton Supabase client.
 * Production: SUPABASE_SERVICE_ROLE_KEY only.
 * Development: service role preferred; anon key allowed as fallback for local setups.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
