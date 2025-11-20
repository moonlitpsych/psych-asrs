import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client for browser/client-side operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Create a separate client for server-side operations with service key
export function getServiceSupabase() {
  // Prefer legacy key if available (it bypasses RLS properly)
  const serviceKey = process.env.SUPABASE_SERVICE_KEY_LEGACY || process.env.SUPABASE_SERVICE_KEY

  if (!serviceKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_KEY_LEGACY')
  }

  const keyType = process.env.SUPABASE_SERVICE_KEY_LEGACY ? 'legacy' : 'new'
  console.log(`Creating service client with ${keyType} key starting:`, serviceKey.substring(0, 10))

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}