import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key, bypasses RLS)
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}

export function getStorageUrl(bucket: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
