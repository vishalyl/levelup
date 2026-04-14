import { getServiceSupabase } from './supabase';

// Since we're doing a simple single-user setup, we'll use a default user
// In production with Clerk, you'd extract the user ID from the session
const DEFAULT_CLERK_ID = 'default_user';

export async function getOrCreateUser() {
  const supabase = getServiceSupabase();

  // Try to find existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', DEFAULT_CLERK_ID)
    .single();

  if (existingUser) return existingUser;

  // Create new user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ clerk_id: DEFAULT_CLERK_ID, character_name: 'Hero' })
    .select()
    .single();

  if (error) throw error;
  return newUser;
}

export async function getUserId(): Promise<string> {
  const user = await getOrCreateUser();
  return user.id;
}
