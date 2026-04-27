import { getServiceSupabase } from './supabase';

// Since we're doing a simple single-user setup, we'll use a default user
// In production with Clerk, you'd extract the user ID from the session
const DEFAULT_CLERK_ID = 'default_user';

export async function getOrCreateUser() {
  const supabase = getServiceSupabase();

  // Upsert to handle race conditions when multiple requests hit simultaneously
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { clerk_id: DEFAULT_CLERK_ID, character_name: 'Hero' },
      { onConflict: 'clerk_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserId(): Promise<string> {
  const user = await getOrCreateUser();
  return user.id;
}
